import { IsNotEmpty, IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({ enum: ['INCOME', 'EXPENSE'] })
  @IsNotEmpty()
  @IsEnum(['INCOME', 'EXPENSE'])
  type: 'INCOME' | 'EXPENSE';

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  date?: string;
}

export class FinancialSummaryDto {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  period: { start: Date; end: Date };
}