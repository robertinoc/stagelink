import { BadRequestException } from '@nestjs/common';
import {
  buildSoundCloudProfileUrl,
  normalizeSoundCloudProfileInput,
} from './soundcloud-insights.helpers';

describe('normalizeSoundCloudProfileInput', () => {
  describe('valid full profile URLs', () => {
    it('accepts https://soundcloud.com/username', () => {
      expect(normalizeSoundCloudProfileInput('https://soundcloud.com/theweeknd')).toBe(
        'https://soundcloud.com/theweeknd',
      );
    });

    it('accepts http://soundcloud.com/username', () => {
      expect(normalizeSoundCloudProfileInput('http://soundcloud.com/theweeknd')).toBe(
        'https://soundcloud.com/theweeknd',
      );
    });

    it('accepts www.soundcloud.com/username', () => {
      expect(normalizeSoundCloudProfileInput('https://www.soundcloud.com/theweeknd')).toBe(
        'https://soundcloud.com/theweeknd',
      );
    });

    it('accepts m.soundcloud.com/username (mobile)', () => {
      expect(normalizeSoundCloudProfileInput('https://m.soundcloud.com/theweeknd')).toBe(
        'https://soundcloud.com/theweeknd',
      );
    });

    it('accepts trailing slash in URL', () => {
      expect(normalizeSoundCloudProfileInput('https://soundcloud.com/theweeknd/')).toBe(
        'https://soundcloud.com/theweeknd',
      );
    });

    it('strips query parameters from URL', () => {
      expect(
        normalizeSoundCloudProfileInput('https://soundcloud.com/theweeknd?ref=someplace'),
      ).toBe('https://soundcloud.com/theweeknd');
    });

    it('lowercases the permalink', () => {
      expect(normalizeSoundCloudProfileInput('https://soundcloud.com/TheWeeknd')).toBe(
        'https://soundcloud.com/theweeknd',
      );
    });
  });

  describe('URL without protocol', () => {
    it('accepts soundcloud.com/username without https://', () => {
      expect(normalizeSoundCloudProfileInput('soundcloud.com/theweeknd')).toBe(
        'https://soundcloud.com/theweeknd',
      );
    });
  });

  describe('bare username/permalink', () => {
    it('accepts a plain lowercase username', () => {
      expect(normalizeSoundCloudProfileInput('theweeknd')).toBe('https://soundcloud.com/theweeknd');
    });

    it('accepts hyphenated usernames', () => {
      expect(normalizeSoundCloudProfileInput('the-weeknd')).toBe(
        'https://soundcloud.com/the-weeknd',
      );
    });

    it('accepts underscored usernames', () => {
      expect(normalizeSoundCloudProfileInput('the_weeknd')).toBe(
        'https://soundcloud.com/the_weeknd',
      );
    });

    it('lowercases bare usernames', () => {
      expect(normalizeSoundCloudProfileInput('DJArtist')).toBe('https://soundcloud.com/djartist');
    });

    it('trims whitespace around bare usernames', () => {
      expect(normalizeSoundCloudProfileInput('  theweeknd  ')).toBe(
        'https://soundcloud.com/theweeknd',
      );
    });
  });

  describe('invalid inputs', () => {
    it('throws on empty string', () => {
      expect(() => normalizeSoundCloudProfileInput('')).toThrow(BadRequestException);
    });

    it('throws on whitespace-only string', () => {
      expect(() => normalizeSoundCloudProfileInput('   ')).toThrow(BadRequestException);
    });

    it('throws on non-SoundCloud URL', () => {
      expect(() => normalizeSoundCloudProfileInput('https://open.spotify.com/artist/xxx')).toThrow(
        BadRequestException,
      );
    });

    it('throws on a track URL (two URL segments)', () => {
      expect(() =>
        normalizeSoundCloudProfileInput('https://soundcloud.com/theweeknd/blinding-lights'),
      ).toThrow(BadRequestException);
    });

    it('throws on a sets URL', () => {
      expect(() =>
        normalizeSoundCloudProfileInput('https://soundcloud.com/theweeknd/sets/after-hours'),
      ).toThrow(BadRequestException);
    });

    it('throws on a username that is too short (1 char)', () => {
      expect(() => normalizeSoundCloudProfileInput('a')).toThrow(BadRequestException);
    });

    it('throws on a username with spaces', () => {
      expect(() => normalizeSoundCloudProfileInput('the weeknd')).toThrow(BadRequestException);
    });
  });
});

describe('buildSoundCloudProfileUrl', () => {
  it('builds a canonical profile URL from a permalink', () => {
    expect(buildSoundCloudProfileUrl('theweeknd')).toBe('https://soundcloud.com/theweeknd');
  });
});
