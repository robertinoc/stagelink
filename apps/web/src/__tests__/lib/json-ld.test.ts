import { describe, expect, it } from 'vitest';
import { serializeJsonLd } from '@/lib/json-ld';

describe('serializeJsonLd', () => {
  it('escapes script-breaking characters in user-controlled JSON-LD fields', () => {
    const serialized = serializeJsonLd({
      name: '</script><script>alert(1)</script>',
      description: 'A & B > C',
    });

    expect(serialized).not.toContain('</script>');
    expect(serialized).not.toContain('<script>');
    expect(serialized).toContain('\\u003c/script\\u003e');
    expect(serialized).toContain('\\u0026');
    expect(JSON.parse(serialized)).toEqual({
      name: '</script><script>alert(1)</script>',
      description: 'A & B > C',
    });
  });
});
