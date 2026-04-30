import { Module } from '@nestjs/common';
import { ServiceOrdersController } from './service-orders.controller';
import { ServiceOrdersService } from './service-orders.service';
import { ImportService } from './import.service';

@Module({
  controllers: [ServiceOrdersController],
  providers: [ServiceOrdersService, ImportService],
})
export class ServiceOrdersModule {}