// src/til/dto/convert-til.dto.ts
import { IsString, IsNotEmpty, IsOptional, MaxLength, MinLength, Matches } from 'class-validator';

export class ConvertTilDto {
  @IsString({ message: '내용은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '내용을 입력해주세요.' })
  @MinLength(10, { message: '내용은 최소 10자 이상이어야 합니다.' })
  @MaxLength(5000, { message: '내용은 최대 5000자까지 입력 가능합니다.' })
  content: string;

  @IsString({ message: '이미지는 문자열(Base64)이어야 합니다.' })
  @IsOptional()
  image?: string;
}