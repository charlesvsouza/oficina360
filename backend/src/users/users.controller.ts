import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  AdminResetPasswordDto,
} from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Tenant } from '../common/decorators/tenant.decorator';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all users' })
  async findAll(@Tenant() tenant: { tenantId: string }) {
    return this.usersService.findAll(tenant.tenantId);
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Tenant() tenant: { tenantId: string }, @Param('id') id: string) {
    return this.usersService.findById(tenant.tenantId, id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create new user' })
  async create(
    @Tenant() tenant: { tenantId: string },
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.create(tenant.tenantId, { ...dto, createdBy: '' });
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update user' })
  async update(
    @Tenant() tenant: { tenantId: string },
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(tenant.tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete user' })
  async delete(@Tenant() tenant: { tenantId: string }, @Param('id') id: string) {
    return this.usersService.delete(tenant.tenantId, id);
  }

  @Post(':id/change-password')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Change user password' })
  async changePassword(
    @Tenant() tenant: { tenantId: string },
    @Param('id') id: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(tenant.tenantId, id, dto);
  }

  @Post(':id/admin-reset-password')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin reset user password' })
  async adminResetPassword(
    @Tenant() tenant: { tenantId: string },
    @Param('id') id: string,
    @Body() dto: AdminResetPasswordDto,
  ) {
    return this.usersService.adminResetPassword(tenant.tenantId, id, dto);
  }
}