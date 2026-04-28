import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePlanDto {
  @ApiProperty({ enum: ['START', 'PRO', 'REDE'] })
  @IsNotEmpty()
  @IsEnum(['START', 'PRO', 'REDE'])
  plan: 'START' | 'PRO' | 'REDE';
}