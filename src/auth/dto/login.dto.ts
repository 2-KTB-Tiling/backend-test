// src/auth/dto/login.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class GithubLoginDto {
  @IsNotEmpty({ message: 'GitHub 인증 코드는 필수입니다.' })
  @IsString({ message: 'GitHub 인증 코드는 문자열이어야 합니다.' })
  code: string;
}