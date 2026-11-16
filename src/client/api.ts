export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type PublicUser = { id: string; username: string; role: string; isDemo: boolean };

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers = new Headers();
  const method = init.method ?? "GET";
  if (method !== "GET") headers.set("X-Athletics-Fan", "1");
  let body: string | undefined;
  if (init.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(init.body);
  }
  const response = await fetch(path, { method, headers, body, credentials: "same-origin" });
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new ApiError(response.status, data.error || "Request failed.");
  return data as T;
}
