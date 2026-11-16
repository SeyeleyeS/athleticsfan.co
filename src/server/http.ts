export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function json(data: unknown, status = 200, extra?: HeadersInit): Response {
  const headers = new Headers(extra);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { status, headers });
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  const claimed = Number(request.headers.get("content-length") || "0");
  if (claimed > 20_000) throw new ApiError(413, "That was too long.");
  const type = request.headers.get("content-type") || "";
  if (!type.includes("application/json")) throw new ApiError(415, "Send JSON.");
  const text = await request.text();
  if (text.length > 20_000) throw new ApiError(413, "That was too long.");
  try {
    const data: unknown = JSON.parse(text);
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("bad");
    return data as Record<string, unknown>;
  } catch {
    throw new ApiError(400, "That JSON could not be read.");
  }
}

export function textField(data: Record<string, unknown>, key: string): string {
  const value = data[key];
  return typeof value === "string" ? value.trim() : "";
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  );
}

export function assertMutation(request: Request): void {
  if (request.headers.get("X-Athletics-Fan") !== "1") {
    throw new ApiError(403, "Missing the site header.");
  }
  const origin = request.headers.get("Origin");
  if (!origin) return;
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new ApiError(403, "That origin was rejected.");
  }
  if (originHost !== new URL(request.url).host) throw new ApiError(403, "Cross-site request blocked.");
}

export function cookieValue(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

export function sessionCookie(token: string, secure: boolean, maxAge = 1_209_600): string {
  const parts = [`af_session=${token}`, "HttpOnly", "Path=/", "SameSite=Lax", `Max-Age=${maxAge}`];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function isId(value: string): boolean {
  return /^[A-Za-z0-9_-]{8,80}$/.test(value);
}
