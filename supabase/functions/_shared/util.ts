// Web Crypto (global `crypto`) instead of Node's `crypto.randomBytes` -- keeps
// this dependency-free and portable rather than leaning on Deno's Node compat
// layer for something this small.
export function randomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
