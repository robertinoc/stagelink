import { Module, Global } from '@nestjs/common';

// Global module: providers here are available app-wide without re-importing
@Global()
@Module({})
export class CommonModule {}
