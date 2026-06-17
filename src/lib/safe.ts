// Small safety helpers used across the app.

/** Returns the URL only if it is an http(s) URL; otherwise undefined.
 *  Blocks javascript:, data:, vbscript:, file:, and any other dangerous scheme. */
export function safeHttpUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  const v = value.trim();
  if (!/^https?:\/\//i.test(v)) return undefined;
  // Reject newlines/control chars to avoid header / vCard / URL splitting.
  if (/[\u0000-\u001f]/.test(v)) return undefined;
  return v;
}

/** Sanitize a value for safe vCard text injection (RFC 6350).
 *  - removes CR/LF (no line splitting)
 *  - escapes ; , and \  */
export function vcardEscape(value?: string | null): string {
  if (!value) return "";
  return String(value)
    .replace(/[\r\n]+/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}
