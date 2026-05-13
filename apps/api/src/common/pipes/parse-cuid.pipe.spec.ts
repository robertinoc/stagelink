import { BadRequestException } from '@nestjs/common';
import { ParseCuidPipe } from './parse-cuid.pipe';

describe('ParseCuidPipe', () => {
  const pipe = new ParseCuidPipe();

  it('returns valid CUID v1 values unchanged', () => {
    expect(pipe.transform('clx1234567890abcdefghijkl')).toBe('clx1234567890abcdefghijkl');
  });

  it('accepts uppercase alphanumeric CUID characters', () => {
    expect(pipe.transform('CABCDEF1234567890ABCDEFGH')).toBe('CABCDEF1234567890ABCDEFGH');
  });

  it.each(['', 'artist_123', 'blx1234567890abcdefghijkl', 'clx123', 'clx1234567890abcdefghi.jkl'])(
    'throws BadRequestException for malformed ids: %s',
    (value) => {
      expect(() => pipe.transform(value)).toThrow(BadRequestException);
    },
  );

  it('does not reflect malformed ids back in the error message', () => {
    expect(() => pipe.transform('<script>alert(1)</script>')).toThrow('Invalid ID format');
    try {
      pipe.transform('<script>alert(1)</script>');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).message).toBe('Invalid ID format');
    }
  });
});
