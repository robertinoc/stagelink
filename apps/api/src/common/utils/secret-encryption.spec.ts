import {
  decryptSecret,
  decryptSecretOrLegacy,
  encryptSecret,
  isEncryptedSecret,
} from './secret-encryption';

describe('secret-encryption', () => {
  const previousKey = process.env['SECRETS_ENCRYPTION_KEY'];

  beforeEach(() => {
    process.env['SECRETS_ENCRYPTION_KEY'] = 'test-encryption-key-for-stagelink';
  });

  afterAll(() => {
    if (previousKey === undefined) {
      delete process.env['SECRETS_ENCRYPTION_KEY'];
    } else {
      process.env['SECRETS_ENCRYPTION_KEY'] = previousKey;
    }
  });

  it('encrypts and decrypts secrets symmetrically', () => {
    const encrypted = encryptSecret('shpst_test_secret');

    expect(isEncryptedSecret(encrypted)).toBe(true);
    expect(decryptSecret(encrypted)).toBe('shpst_test_secret');
  });

  it('keeps legacy plaintext values readable', () => {
    expect(decryptSecretOrLegacy('legacy_plaintext_value')).toBe('legacy_plaintext_value');
  });
});
