import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePlanDto {
  @ApiProperty({ enum: ['BASIC', 'PREMIUM', 'MASTER'] })
  @IsNotEmpty()
  @IsEnum(['BASIC', 'PREMIUM', 'MASTER'])
  plan: 'BASIC' | 'PREMIUM' | 'MASTER';
}