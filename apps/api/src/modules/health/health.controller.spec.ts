import { ConfigService } from '@nestjs/config';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports APP_ENV separately from NODE_ENV for staging deployments', () => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'app.appEnv') return 'staging';
        if (key === 'app.nodeEnv') return 'production';
        return undefined;
      }),
    } as unknown as ConfigService;

    const response = new HealthController(configService).check();

    expect(response.environment).toBe('staging');
    expect(response.nodeEnv).toBe('production');
  });
});
