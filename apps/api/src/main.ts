import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') ?? 4001;
  const frontendUrl = configService.get<string>('app.frontendUrl') ?? 'http://localhost:4000';
  const nodeEnv = configService.get<string>('app.nodeEnv') ?? 'development';

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS — origins driven solely by config (no hardcoded fallbacks in production)
  const corsOrigins =
    nodeEnv === 'development'
      ? [frontendUrl, 'http://localhost:4000', 'http://localhost:4001']
      : [frontendUrl];

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
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
}

bootstrap().catch((err: unknown) => {
  new Logger('Bootstrap').error(
    'Failed to start application',
    err instanceof Error ? err.stack : String(err),
  );
  process.exit(1);
});
