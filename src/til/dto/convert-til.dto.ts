import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ConvertTilDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  image?: string;
}