import { Module } from '@nestjs/common';
import { SubscribersController } from './subscribers.controller';
import { SubscribersService } from './subscribers.service';
import { PrismaService } from '../../lib/prisma.service';
import { MembershipService } from '../membership/membership.service';

@Module({
  controllers: [SubscribersController],
  providers: [SubscribersService, PrismaService, MembershipService],
})
export class SubscribersModule {}
