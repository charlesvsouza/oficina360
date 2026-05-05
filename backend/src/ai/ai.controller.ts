import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Tenant } from '../common/decorators/tenant.decorator';
import { AiService, AiSuggestDto } from './ai.service';

@ApiTags('AI')
@Controller('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('suggest')
  @ApiOperation({ summary: 'Sugestões de serviços e peças baseadas em sintoma relatado' })
  async suggest(
    @Tenant() tenant: { tenantId: string },
    @Body() dto: AiSuggestDto,
  ) {
    return this.aiService.suggest(tenant.tenantId, dto);
  }
}
