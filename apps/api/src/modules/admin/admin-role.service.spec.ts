import { Redis } from '@upstash/redis';
import { AdminRoleService } from './admin-role.service';

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn(),
}));

const RedisMock = Redis as unknown as jest.Mock;

describe('AdminRoleService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('treats bootstrap env owners as owners without Redis', async () => {
    delete process.env['UPSTASH_REDIS_KV_REST_API_URL'];
    delete process.env['UPSTASH_REDIS_KV_REST_API_TOKEN'];

    const service = new AdminRoleService();

    await expect(service.getRole('ROBERTINOC@GMAIL.COM')).resolves.toBe('owner');
    expect(RedisMock).not.toHaveBeenCalled();
  });

  it('resolves dynamic admin roles from Redis', async () => {
    process.env['UPSTASH_REDIS_KV_REST_API_URL'] = 'https://redis.example.com';
    process.env['UPSTASH_REDIS_KV_REST_API_TOKEN'] = 'token';
    RedisMock.mockImplementationOnce(() => ({
      get: jest.fn().mockResolvedValue({ 'admin@example.com': 'admin' }),
    }));

    const service = new AdminRoleService();

    await expect(service.getRole('Admin@Example.com')).resolves.toBe('admin');
    await expect(service.hasAccess('admin@example.com')).resolves.toBe(true);
  });

  it('fails closed for dynamic admins when Redis is unavailable', async () => {
    process.env['UPSTASH_REDIS_KV_REST_API_URL'] = 'https://redis.example.com';
    process.env['UPSTASH_REDIS_KV_REST_API_TOKEN'] = 'token';
    RedisMock.mockImplementationOnce(() => ({
      get: jest.fn().mockRejectedValue(new Error('redis unavailable')),
    }));

    const service = new AdminRoleService();

    await expect(service.getRole('admin@example.com')).resolves.toBeNull();
    await expect(service.hasAccess('admin@example.com')).resolves.toBe(false);
  });
});
