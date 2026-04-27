import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Tenant } from '../common/decorators/tenant.decorator';
import { RequirePlan } from '../auth/guards/plan.guard';

@ApiTags('Services')
@Controller('services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'List all services' })
  async findAll(@Tenant() tenant: { tenantId: string }) {
    return this.servicesService.findAll(tenant.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  async findOne(@Tenant() tenant: { tenantId: string }, @Param('id') id: string) {
    return this.servicesService.findById(tenant.tenantId, id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create service' })
  async create(@Tenant() tenant: { tenantId: string }, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(tenant.tenantId, dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update service' })
  async update(
    @Tenant() tenant: { tenantId: string },
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(tenant.tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete service (soft delete)' })
  async delete(@Tenant() tenant: { tenantId: string }, @Param('id') id: string) {
    return this.servicesService.delete(tenant.tenantId, id);
  }
}