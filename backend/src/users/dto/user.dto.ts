import { IsEmail, IsNotEmpty, IsOptional, IsString, IsEnum, MinLength, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole, JobFunction, WorkshopArea } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsEmail()
  @IsString()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  @IsString()
  recoveryEmail?: string;

  @ApiProperty({ enum: UserRole, required: false, default: 'PRODUTIVO' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ enum: JobFunction, required: false })
  @IsOptional()
  @IsEnum(JobFunction)
  jobFunction?: JobFunction;

  @ApiProperty({ enum: WorkshopArea, required: false })
  @IsOptional()
  @IsEnum(WorkshopArea)
  workshopArea?: WorkshopArea;

  @ApiProperty({ required: false, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionPercent?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  chiefId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  isActive?: boolean;
}

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  @IsString()
  recoveryEmail?: string;

  @ApiProperty({ enum: UserRole, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ enum: JobFunction, required: false })
  @IsOptional()
  @IsEnum(JobFunction)
  jobFunction?: JobFunction;

  @ApiProperty({ enum: WorkshopArea, required: false })
  @IsOptional()
  @IsEnum(WorkshopArea)
  workshopArea?: WorkshopArea;

  @ApiProperty({ required: false, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionPercent?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  chiefId?: string;


  @ApiProperty({ required: false })
  @IsOptional()
  isActive?: boolean;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class AdminResetPasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  newPassword: string;
}