import { BadRequestException } from '@nestjs/common';
import { validateBlockConfig } from './block-config.schema';

describe('validateBlockConfig — record_labels', () => {
  it('accepts an empty labelIds array (show all)', () => {
    expect(() => validateBlockConfig('record_labels', { labelIds: [] })).not.toThrow();
  });

  it('accepts a list of label IDs in display order', () => {
    expect(() =>
      validateBlockConfig('record_labels', { labelIds: ['lbl_1', 'lbl_2'] }),
    ).not.toThrow();
  });

  it('rejects a missing labelIds field', () => {
    expect(() => validateBlockConfig('record_labels', {})).toThrow(BadRequestException);
  });

  it('rejects labelIds that is not an array', () => {
    expect(() => validateBlockConfig('record_labels', { labelIds: 'lbl_1' })).toThrow(
      BadRequestException,
    );
  });

  it('rejects duplicate label IDs', () => {
    expect(() => validateBlockConfig('record_labels', { labelIds: ['lbl_1', 'lbl_1'] })).toThrow(
      BadRequestException,
    );
  });

  it('rejects empty-string IDs', () => {
    expect(() => validateBlockConfig('record_labels', { labelIds: [''] })).toThrow(
      BadRequestException,
    );
  });

  it('rejects more than 50 label IDs', () => {
    const ids = Array.from({ length: 51 }, (_, i) => `lbl_${i}`);
    expect(() => validateBlockConfig('record_labels', { labelIds: ids })).toThrow(
      BadRequestException,
    );
  });
});
