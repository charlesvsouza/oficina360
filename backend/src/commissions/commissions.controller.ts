import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, Tenant } from '../common/decorators/tenant.decorator';
import { CommissionsService } from './commissions.service';

@ApiTags('Commissions')
@Controller('commissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get()
  @Roles('MASTER', 'ADMIN', 'FINANCEIRO', 'CHEFE_OFICINA', 'MECANICO', 'PRODUTIVO')
  @ApiOperation({ summary: 'Listar comissões com filtros de período e status' })
  async findAll(
    @Tenant() tenant: { tenantId: string },
    @CurrentUser() user: { userId: string; role: string },
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('workshopArea') workshopArea?: string,
  ) {
    return this.commissionsService.findAll(tenant.tenantId, user, {
      startDate,
      endDate,
      status,
      userId,
      workshopArea,
    });
  }

  @Patch(':id/pay')
  @Roles('MASTER', 'ADMIN', 'FINANCEIRO')
  @ApiOperation({ summary: 'Marcar comissão como paga' })
  async markAsPaid(
    @Tenant() tenant: { tenantId: string },
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.commissionsService.markAsPaid(tenant.tenantId, id, user.userId);
  }
}
