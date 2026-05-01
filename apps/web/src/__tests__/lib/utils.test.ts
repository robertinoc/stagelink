import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn()', () => {
  it('returns a single class unchanged', () => {
    expect(cn('flex')).toBe('flex');
  });

  it('merges multiple classes', () => {
    expect(cn('flex', 'items-center', 'gap-4')).toBe('flex items-center gap-4');
  });

  it('deduplicates conflicting Tailwind utilities (tailwind-merge)', () => {
    // tailwind-merge resolves conflicts — last one wins
    expect(cn('p-4', 'p-8')).toBe('p-8');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('filters out falsy values (clsx)', () => {
    expect(cn('flex', undefined, null, false, '', 'gap-2')).toBe('flex gap-2');
  });

  it('handles conditional classes via clsx objects', () => {
    expect(cn({ flex: true, hidden: false, 'items-center': true })).toBe('flex items-center');
  });

  it('handles conditional classes via arrays', () => {
    const isActive = true;
    expect(cn('base', isActive && 'active', !isActive && 'inactive')).toBe('base active');
  });

  it('returns empty string for all-falsy inputs', () => {
    expect(cn(undefined, null, false)).toBe('');
  });

  it('combines conditional objects with string classes', () => {
    expect(cn('btn', { 'btn-primary': true, 'btn-disabled': false })).toBe('btn btn-primary');
  });
});
