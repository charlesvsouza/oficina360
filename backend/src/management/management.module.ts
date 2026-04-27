import { Module } from '@nestjs/common';
import { ManagementService } from './management.service';
import { ManagementController } from './management.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ManagementService],
  controllers: [ManagementController],
})
export class ManagementModule {}
