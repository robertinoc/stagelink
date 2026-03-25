import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: process.env['FRONTEND_URL'] ?? 'http://localhost:4000' });

  const port = process.env['PORT'] ?? 4001;
  await app.listen(port);
  console.warn(`API running on http://localhost:${port}/api/v1`);
}

bootstrap();
