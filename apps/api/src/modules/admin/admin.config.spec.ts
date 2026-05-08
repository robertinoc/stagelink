import { parseBehindOwnerEmails } from './admin.config';

describe('admin config', () => {
  it('parses comma-separated Behind owner emails from env config', () => {
    expect(parseBehindOwnerEmails(' Owner@Example.com, admin@example.com ,, ')).toEqual([
      'owner@example.com',
      'admin@example.com',
    ]);
  });

  it('falls back to the bootstrap owner when env config is empty', () => {
    expect(parseBehindOwnerEmails(' , ')).toEqual(['robertinoc@gmail.com']);
  });
});
