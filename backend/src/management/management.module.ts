import { Module } from '@nestjs/common';
import { ManagementService } from './management.service';
import { ManagementController } from './management.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SeedService } from '../superadmin/seed.service';

@Module({
  imports: [PrismaModule],
  providers: [ManagementService, SeedService],
  controllers: [ManagementController],
})
export class ManagementModule {}
