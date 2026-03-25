import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

/**
 * Determine whether an incoming origin is allowed.
 *
 * Rules (in order):
 * 1. Exact match against FRONTEND_URL (production domain)
 * 2. Any extra origins listed in CORS_ALLOWED_ORIGINS (comma-separated)
 * 3. Vercel preview deployments: *.vercel.app URLs for the stagelink project
 * 4. localhost / 127.0.0.1 in development only
 */
function buildCorsOriginHandler(
  frontendUrl: string,
  extraOrigins: string[],
  nodeEnv: string,
): (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void {
  const vercelPreviewPattern = /^https:\/\/stagelink[a-z0-9-]*\.vercel\.app$/;

  return (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, health checks)
    if (!origin) return callback(null, true);

    // Exact match: production frontend URL
    if (origin === frontendUrl) return callback(null, true);

    // Extra allowed origins (e.g. app.stagelink.io, staging.stagelink.io)
    if (extraOrigins.includes(origin)) return callback(null, true);

    // Vercel preview deployments (e.g. stagelink-git-feat-xyz.vercel.app)
    if (vercelPreviewPattern.test(origin)) return callback(null, true);

    // localhost in development
    if (nodeEnv === 'development') {
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }

    callback(new Error(`CORS: origin '${origin}' not allowed`));
  };
}

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') ?? 4001;
  const frontendUrl = configService.get<string>('app.frontendUrl') ?? 'http://localhost:4000';
  const nodeEnv = configService.get<string>('app.nodeEnv') ?? 'development';

  // CORS_ALLOWED_ORIGINS: optional comma-separated extra origins (e.g. app.stagelink.io,staging.stagelink.io)
  const extraOrigins = (configService.get<string>('app.corsAllowedOrigins') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: buildCorsOriginHandler(frontendUrl, extraOrigins, nodeEnv),
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(port);
  logger.log(`🚀 StageLink API running on port ${port}`);
  logger.log(`📍 Environment: ${nodeEnv}`);
  if (extraOrigins.length) {
    logger.log(`🌐 Extra CORS origins: ${extraOrigins.join(', ')}`);
  }
}

bootstrap().catch((err: unknown) => {
  new Logger('Bootstrap').error(
    'Failed to start application',
    err instanceof Error ? err.stack : String(err),
  );
  process.exit(1);
});
