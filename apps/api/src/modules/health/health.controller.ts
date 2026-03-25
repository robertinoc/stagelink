import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface HealthResponse {
  status: 'ok';
  timestamp: string;
  environment: string;
  version: string;
  uptime: number;
}

@Controller('health')
export class HealthController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  check(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: this.configService.get<string>('app.nodeEnv') ?? 'development',
      version: process.env['npm_package_version'] ?? '0.1.0',
      uptime: Math.floor(process.uptime()),
    };
  }
}
