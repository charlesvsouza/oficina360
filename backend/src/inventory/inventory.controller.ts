import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreatePartDto, UpdatePartDto, CreateMovementDto } from './dto/inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Tenant } from '../common/decorators/tenant.decorator';

@ApiTags('Inventory')
@Controller('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get('parts')
  @ApiOperation({ summary: 'List all parts' })
  async findAllParts(@Tenant() tenant: { tenantId: string }) {
    return this.inventoryService.findAllParts(tenant.tenantId);
  }

  @Get('parts/:id')
  @ApiOperation({ summary: 'Get part by ID' })
  async findPartById(@Tenant() tenant: { tenantId: string }, @Param('id') id: string) {
    return this.inventoryService.findPartById(tenant.tenantId, id);
  }

  @Post('parts')
  @Roles('MASTER', 'ADMIN')
  @ApiOperation({ summary: 'Create part' })
  async createPart(@Tenant() tenant: { tenantId: string }, @Body() dto: CreatePartDto) {
    return this.inventoryService.createPart(tenant.tenantId, dto);
  }

  @Patch('parts/:id')
  @Roles('MASTER', 'ADMIN')
  @ApiOperation({ summary: 'Update part' })
  async updatePart(
    @Tenant() tenant: { tenantId: string },
    @Param('id') id: string,
    @Body() dto: UpdatePartDto,
  ) {
    return this.inventoryService.updatePart(tenant.tenantId, id, dto);
  }

  @Delete('parts/:id')
  @Roles('MASTER', 'ADMIN')
  @ApiOperation({ summary: 'Delete part (soft delete)' })
  async deletePart(@Tenant() tenant: { tenantId: string }, @Param('id') id: string) {
    return this.inventoryService.deletePart(tenant.tenantId, id);
  }

  @Post('movements')
  @Roles('MASTER', 'ADMIN')
  @ApiOperation({ summary: 'Create inventory movement' })
  async createMovement(@Tenant() tenant: { tenantId: string }, @Body() dto: CreateMovementDto) {
    return this.inventoryService.createMovement(tenant.tenantId, dto);
  }

  @Get('stock-report')
  @ApiOperation({ summary: 'Get stock report' })
  async getStockReport(@Tenant() tenant: { tenantId: string }) {
    return this.inventoryService.getStockReport(tenant.tenantId);
  }
}