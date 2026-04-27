import { Controller, Get, Patch, Body, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { UpdateTenantDto } from './dto/tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Tenant } from '../common/decorators/tenant.decorator';

@ApiTags('Tenants')
@Controller('tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current tenant' })
  async getMe(@Tenant() tenant: { tenantId: string }) {
    return this.tenantsService.findById(tenant.tenantId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current tenant' })
  async updateMe(@Tenant() tenant: { tenantId: string }, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(tenant.tenantId, dto);
  }
}