import { IsString, IsNotEmpty, IsBoolean, IsIn } from 'class-validator';

export class EnhanceTilDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsIn(['ko', 'en'])
  language: string;

  @IsBoolean()
  include_images: boolean;
}