import { BadRequestException } from '@nestjs/common';
import { validateBlockConfig } from './block-config.schema';

describe('validateBlockConfig — public_counters', () => {
  it('accepts an empty show array (show all)', () => {
    expect(() => validateBlockConfig('public_counters', { show: [] })).not.toThrow();
  });

  it('accepts a subset of valid counter keys in order', () => {
    expect(() =>
      validateBlockConfig('public_counters', { show: ['collabs', 'eps'] }),
    ).not.toThrow();
  });

  it('accepts all three keys', () => {
    expect(() =>
      validateBlockConfig('public_counters', { show: ['eps', 'labels', 'collabs'] }),
    ).not.toThrow();
  });

  it('rejects a missing show field', () => {
    expect(() => validateBlockConfig('public_counters', {})).toThrow(BadRequestException);
  });

  it('rejects show that is not an array', () => {
    expect(() => validateBlockConfig('public_counters', { show: 'eps' })).toThrow(
      BadRequestException,
    );
  });

  it('rejects unknown counter keys', () => {
    expect(() => validateBlockConfig('public_counters', { show: ['followers'] })).toThrow(
      BadRequestException,
    );
  });

  it('rejects duplicate keys', () => {
    expect(() => validateBlockConfig('public_counters', { show: ['eps', 'eps'] })).toThrow(
      BadRequestException,
    );
  });

  it('rejects more than the three known keys', () => {
    expect(() =>
      validateBlockConfig('public_counters', { show: ['eps', 'labels', 'collabs', 'eps'] }),
    ).toThrow(BadRequestException);
  });
});
