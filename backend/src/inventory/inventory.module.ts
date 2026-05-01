import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { ImportNfService } from './import-nf.service';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, ImportNfService],
})
export class InventoryModule {}