export const PBKDF2_ITERATIONS = 100_000;

const encoder = new TextEncoder();

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

export function timingSafeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left[i] ^ right[i];
  return diff === 0;
}

function saltBuffer(salt: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(salt.byteLength);
  new Uint8Array(copy).set(salt);
  return copy;
}

async function pbkdf2(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: saltBuffer(salt), iterations: PBKDF2_ITERATIONS },
    material,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string, saltInput?: Uint8Array): Promise<{ salt: string; hash: string }> {
  const salt = new Uint8Array(new ArrayBuffer(saltInput?.byteLength ?? 16));
  if (saltInput) salt.set(saltInput);
  else crypto.getRandomValues(salt);
  const bits = await pbkdf2(password, salt);
  return { salt: bytesToBase64(salt), hash: bytesToBase64(bits) };
}

export async function verifyPassword(password: string, saltB64: string, hashB64: string): Promise<boolean> {
  const actual = await pbkdf2(password, base64ToBytes(saltB64));
  return timingSafeEqual(actual, base64ToBytes(hashB64));
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function sha256Base64(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return bytesToBase64(new Uint8Array(digest));
}
