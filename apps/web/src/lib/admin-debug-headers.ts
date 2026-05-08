const SENSITIVE_HEADER_PATTERNS = [
  /^authorization$/i,
  /^cookie$/i,
  /^set-cookie$/i,
  /^proxy-authorization$/i,
  /^x-vercel-protection-bypass$/i,
  /token/i,
  /secret/i,
  /key/i,
  /signature/i,
];

export function isAdminDebugHeadersEnabled(): boolean {
  return process.env.BEHIND_DEBUG_HEADERS_ENABLED === 'true';
}

export function redactAdminDebugHeader(key: string, value: string): string {
  if (SENSITIVE_HEADER_PATTERNS.some((pattern) => pattern.test(key))) {
    return '[redacted]';
  }

  return value;
}

export function collectAdminDebugHeaders(headers: Headers): Record<string, string> {
  const safeHeaders: Record<string, string> = {};

  headers.forEach((value, key) => {
    safeHeaders[key] = redactAdminDebugHeader(key, value);
  });

  return safeHeaders;
}
