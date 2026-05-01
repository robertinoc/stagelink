import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RESET_TABLES } from './integration-db';

describe('integration database reset coverage', () => {
  it('includes every mapped Prisma model table', () => {
    const schema = readFileSync(resolve(__dirname, '../../prisma/schema.prisma'), 'utf8');

    const mappedTables = [...schema.matchAll(/model\s+\w+\s+\{([\s\S]*?)\n\}/g)]
      .map((modelMatch) => modelMatch[1]?.match(/@@map\("([^"]+)"\)/)?.[1])
      .filter((table): table is string => Boolean(table));
    const missingTables = mappedTables.filter((table) => !RESET_TABLES.includes(table as never));

    expect(missingTables).toEqual([]);
  });
});
