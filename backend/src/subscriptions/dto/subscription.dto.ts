import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePlanDto {
  @ApiProperty({ enum: ['START', 'PRO', 'REDE'] })
  @IsNotEmpty()
  @IsEnum(['START', 'PRO', 'REDE'])
  plan: 'START' | 'PRO' | 'REDE';
}

export class CreateCheckoutDto {
  @ApiProperty({ enum: ['START', 'PRO', 'REDE'] })
  @IsNotEmpty()
  @IsEnum(['START', 'PRO', 'REDE'])
  plan: 'START' | 'PRO' | 'REDE';

  @ApiProperty({ required: false, description: 'URL de sucesso após pagamento' })
  @IsOptional()
  @IsString()
  successUrl?: string;

  @ApiProperty({ required: false, description: 'URL de cancelamento/retorno' })
  @IsOptional()
  @IsString()
  cancelUrl?: string;
}