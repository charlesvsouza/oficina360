import { Controller, Post, Get, Body } from '@nestjs/common';
import { ManagementService } from './management.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Management')
@Controller('management')
export class ManagementController {
  constructor(private managementService: ManagementService) {}

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
}
