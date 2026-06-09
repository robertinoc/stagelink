import { BadRequestException } from '@nestjs/common';
import { validateBlockConfig } from './block-config.schema';

describe('validateBlockConfig — releases', () => {
  it('accepts an empty releaseIds array (show all)', () => {
    expect(() => validateBlockConfig('releases', { releaseIds: [] })).not.toThrow();
  });

  it('accepts a list of release IDs in display order', () => {
    expect(() =>
      validateBlockConfig('releases', { releaseIds: ['rel_1', 'rel_2', 'rel_3'] }),
    ).not.toThrow();
  });

  it('rejects a missing releaseIds field', () => {
    expect(() => validateBlockConfig('releases', {})).toThrow(BadRequestException);
  });

  it('rejects releaseIds that is not an array', () => {
    expect(() => validateBlockConfig('releases', { releaseIds: 'rel_1' })).toThrow(
      BadRequestException,
    );
  });

  it('rejects duplicate release IDs', () => {
    expect(() => validateBlockConfig('releases', { releaseIds: ['rel_1', 'rel_1'] })).toThrow(
      BadRequestException,
    );
  });

  it('rejects empty-string IDs', () => {
    expect(() => validateBlockConfig('releases', { releaseIds: [''] })).toThrow(
      BadRequestException,
    );
  });

  it('rejects more than 50 release IDs', () => {
    const ids = Array.from({ length: 51 }, (_, i) => `rel_${i}`);
    expect(() => validateBlockConfig('releases', { releaseIds: ids })).toThrow(BadRequestException);
  });
});
