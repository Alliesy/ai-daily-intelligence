export function safeReturnPath(value: string | null | undefined, fallback = "/") {
  if (!value || value.length > 2048 || /[\\\u0000-\u001f\u007f]/.test(value)) return fallback;
  let decoded = value;
  try {
    for (let index = 0; index < 5; index += 1) {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }
    if (decodeURIComponent(decoded) !== decoded) return fallback;
  } catch {
    return fallback;
  }
  if (/[\\\u0000-\u001f\u007f]/.test(decoded) || !decoded.startsWith("/") || decoded.startsWith("//")) return fallback;
  try {
    const parsed = new URL(decoded, "https://return.invalid");
    if (parsed.origin !== "https://return.invalid") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
