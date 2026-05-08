import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { buildCorsOriginHandler, CORS_ALLOWED_HEADERS } from './config/cors';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
    rawBody: true,
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

  // Baseline security headers for API responses.
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  // CORS
  app.enableCors({
    origin: buildCorsOriginHandler(frontendUrl, extraOrigins, nodeEnv),
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [...CORS_ALLOWED_HEADERS],
    exposedHeaders: ['X-Request-ID'],
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
