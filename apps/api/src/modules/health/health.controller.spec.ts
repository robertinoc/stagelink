import { ConfigService } from '@nestjs/config';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports APP_ENV separately from NODE_ENV and observability readiness', () => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'app.appEnv') return 'staging';
        if (key === 'app.nodeEnv') return 'production';
        if (key === 'SENTRY_DSN') return 'https://examplePublicKey@sentry.example/1';
        if (key === 'POSTHOG_KEY') return 'ph_test';
        return undefined;
      }),
    } as unknown as ConfigService;

    const response = new HealthController(configService).check();

    expect(response.environment).toBe('staging');
    expect(response.nodeEnv).toBe('production');
    expect(response.observability).toEqual({
      sentryConfigured: true,
      posthogConfigured: true,
    });
  });
});
