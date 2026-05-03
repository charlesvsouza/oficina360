import { Controller, Post, Get, Body, Headers, Param, ForbiddenException } from '@nestjs/common';
import { ManagementService } from './management.service';
import { SeedService } from '../superadmin/seed.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Management')
@Controller('management')
export class ManagementController {
  constructor(
    private managementService: ManagementService,
    private seedService: SeedService,
  ) {}

  @Post('setup')
  @ApiOperation({ summary: 'Create a new tenant with an admin user' })
  async setup(@Body() dto: any) {
    return this.managementService.createTenantWithAdmin(dto);
  }

  @Get('tenants')
  @ApiOperation({ summary: 'List all tenants' })
  async listTenants() {
    return this.managementService.listAllTenants();
  }

  @Post('seed-demo')
  @ApiOperation({ summary: 'Popula dados demo (OS, executores, comissões). Requer header x-seed-key.' })
  async seedDemo(@Headers('x-seed-key') key: string) {
    const secret = process.env.SEED_SECRET || 'sygma-seed-2026';
    if (key !== secret) throw new ForbiddenException('Chave inválida');
    const tenant = await this.managementService.getFirstActiveTenant();
    try {
      return await this.seedService.runDemo(tenant.id);
    } catch (err) {
      return { error: true, message: err?.message, stack: err?.stack?.split('\n').slice(0, 5) };
    }
  }

  @Post('seed-demo/:tenantId')
  @ApiOperation({ summary: 'Popula dados demo em tenant específico. Requer header x-seed-key.' })
  async seedDemoForTenant(@Headers('x-seed-key') key: string, @Param('tenantId') tenantId: string) {
    const secret = process.env.SEED_SECRET || 'sygma-seed-2026';
    if (key !== secret) throw new ForbiddenException('Chave inválida');
    try {
      return await this.seedService.runDemo(tenantId);
    } catch (err) {
      return { error: true, message: err?.message, stack: err?.stack?.split('\n').slice(0, 5) };
    }
  }
}
