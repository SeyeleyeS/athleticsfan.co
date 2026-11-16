import { sha256Base64 } from "./password";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function safeJson(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Trusted editorial and internal links written as [label](url) inside plain paragraphs. */
export function richText(text: string): string {
  const escaped = escapeHtml(text);
  return escaped
    .replace(
      /\[([^\]]+)\]\((\/[^)\s]+)\)/g,
      (_match, label: string, href: string) => `<a href="${href}">${label}</a>`,
    )
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      (_match, label: string, href: string) =>
        `<a href="${href}" rel="noopener" target="_blank">${label}<span class="sr-only"> (opens in a new tab)</span></a>`,
    );
}

export function linkifyEscaped(escaped: string, rel: string): string {
  return escaped.replace(/https:\/\/[^\s<]+/g, (raw) => {
    const href = raw.replace(/[),.;!?]+$/g, "");
    const trailing = raw.slice(href.length);
    return `<a href="${href}" rel="${rel}" target="_blank">${href}<span class="sr-only"> (opens in a new tab)</span></a>${trailing}`;
  });
}

export function plainToHtml(text: string, rel = "ugc noopener"): string {
  return linkifyEscaped(escapeHtml(text), rel);
}

export async function cspMeta(jsonLd: string | null): Promise<string> {
  const hashes = ["'self'"];
  if (jsonLd) hashes.push(`'sha256-${await sha256Base64(jsonLd)}'`);
  const policy = [
    "default-src 'self'",
    `script-src ${hashes.join(" ")}`,
    "style-src 'self'",
    "img-src 'self' https: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
  return `<meta http-equiv="Content-Security-Policy" content="${escapeHtml(policy)}">`;
}
