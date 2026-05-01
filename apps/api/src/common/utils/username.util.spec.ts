import {
  normalizeAndValidateUsername,
  normalizeUsername,
  validateUsernameFormat,
} from './username.util';

describe('username.util', () => {
  describe('normalizeUsername', () => {
    it('trims whitespace and lowercases input without rewriting invalid characters', () => {
      expect(normalizeUsername('  Stage-Link_01  ')).toBe('stage-link_01');
      expect(normalizeUsername('  DJ.Name  ')).toBe('dj.name');
    });
  });

  describe('validateUsernameFormat', () => {
    it('accepts lowercase letters, numbers, hyphens and underscores within length limits', () => {
      expect(validateUsernameFormat('robertinoc')).toEqual({ valid: true });
      expect(validateUsernameFormat('dj-shadow_123')).toEqual({ valid: true });
      expect(validateUsernameFormat('abc')).toEqual({ valid: true });
      expect(validateUsernameFormat('a'.repeat(30))).toEqual({ valid: true });
    });

    it('rejects usernames that are too short or too long', () => {
      expect(validateUsernameFormat('ab')).toEqual({
        valid: false,
        reason: 'Username must be at least 3 characters',
      });
      expect(validateUsernameFormat('a'.repeat(31))).toEqual({
        valid: false,
        reason: 'Username must be at most 30 characters',
      });
    });

    it('rejects edge separators, invalid characters and consecutive separators', () => {
      expect(validateUsernameFormat('-artist')).toMatchObject({ valid: false });
      expect(validateUsernameFormat('artist_')).toMatchObject({ valid: false });
      expect(validateUsernameFormat('dj.name')).toMatchObject({ valid: false });
      expect(validateUsernameFormat('röbertino')).toMatchObject({ valid: false });
      expect(validateUsernameFormat('my--name')).toEqual({
        valid: false,
        reason: 'Username cannot contain consecutive hyphens or underscores (e.g. -- or __)',
      });
      expect(validateUsernameFormat('my__name')).toEqual({
        valid: false,
        reason: 'Username cannot contain consecutive hyphens or underscores (e.g. -- or __)',
      });
    });
  });

  describe('normalizeAndValidateUsername', () => {
    it('returns the normalized username when valid', () => {
      expect(normalizeAndValidateUsername('  DJ-Shadow  ')).toBe('dj-shadow');
    });

    it('returns null for invalid normalized values', () => {
      expect(normalizeAndValidateUsername('DJ Shadow')).toBeNull();
      expect(normalizeAndValidateUsername('__artist')).toBeNull();
    });
  });
});
