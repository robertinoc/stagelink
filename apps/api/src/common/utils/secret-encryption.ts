import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const SECRET_PREFIX = 'enc:v1';
const IV_LENGTH_BYTES = 12;

function resolveKey(rawKey?: string): Buffer {
  const normalized = rawKey?.trim() || process.env['SECRETS_ENCRYPTION_KEY']?.trim();
  if (!normalized) {
    throw new Error('SECRETS_ENCRYPTION_KEY is not set');
  }

  return createHash('sha256').update(normalized).digest();
}

export function isEncryptedSecret(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.startsWith(`${SECRET_PREFIX}:`);
}

export function encryptSecret(value: string, rawKey?: string): string {
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv('aes-256-gcm', resolveKey(rawKey), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${SECRET_PREFIX}:${iv.toString('base64url')}:${authTag.toString('base64url')}:${encrypted.toString('base64url')}`;
}

export function decryptSecret(value: string, rawKey?: string): string {
  if (!isEncryptedSecret(value)) {
    return value;
  }

  const [, version, ivRaw, authTagRaw, encryptedRaw] = value.split(':');
  if (version !== 'v1' || !ivRaw || !authTagRaw || !encryptedRaw) {
    throw new Error('Encrypted secret has an invalid format');
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    resolveKey(rawKey),
    Buffer.from(ivRaw, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(authTagRaw, 'base64url'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, 'base64url')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

export function decryptSecretOrLegacy(value: string | null | undefined, rawKey?: string): string {
  if (!value) {
    return '';
  }

  return decryptSecret(value, rawKey);
}
