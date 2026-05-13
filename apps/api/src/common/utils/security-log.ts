const MAX_SECURITY_LOG_FIELD_LENGTH = 256;

export type SecurityLogMetadata = Record<string, unknown>;

export function formatSecurityEvent(event: string, metadata: SecurityLogMetadata = {}): string {
  return `security_event=${sanitizeLogValue(event)} ${JSON.stringify(sanitizeMetadata(metadata))}`;
}

export function sanitizeLogPath(path: string | undefined): string {
  if (!path) return '/';
  const [pathname] = path.split('?');
  return sanitizeLogValue(pathname || '/');
}

export function sanitizeLogValue(value: unknown): string {
  return String(value ?? '')
    .replace(/[\r\n\t]/g, ' ')
    .slice(0, MAX_SECURITY_LOG_FIELD_LENGTH);
}

function sanitizeMetadata(metadata: SecurityLogMetadata): SecurityLogMetadata {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      const sanitizedKey = sanitizeLogValue(key);
      return [sanitizedKey, sanitizeMetadataValue(value, sanitizedKey)];
    }),
  );
}

function sanitizeMetadataValue(value: unknown, key = ''): unknown {
  if (Array.isArray(value)) return value.map((item) => sanitizeMetadataValue(item, key));
  if (value !== null && typeof value === 'object')
    return sanitizeMetadata(value as SecurityLogMetadata);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (key.toLowerCase().includes('path') || key.toLowerCase().includes('url')) {
    return sanitizeLogPath(String(value ?? ''));
  }
  return sanitizeLogValue(value);
}
