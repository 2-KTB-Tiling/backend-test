// src/auth/auth.controller.ts
import { Controller, Post, Body, Get, UseGuards, Req, HttpCode, HttpStatus, Query, Res, Redirect , BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GithubLoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthResponse } from './interfaces/github-user.interface';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * GitHub OAuth 로그인 처리
   * @param loginDto GitHub 인증 코드를 포함한 DTO
   * @returns JWT 토큰과 사용자 정보
   */
  @Post('github')
  @HttpCode(HttpStatus.OK)
  async githubLogin(@Body() loginDto: GithubLoginDto): Promise<AuthResponse> {
    return await this.authService.loginWithGithub(loginDto.code);
  }

  /**
   * 현재 로그인된 사용자 정보 조회
   * @param req 요청 객체 (JWT 인증된 사용자 정보 포함)
   * @returns 사용자 정보
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req) {
    const user = await this.authService.getCurrentUser(req.user.id);
    return {
      message: 'success',
      data: { user },
    };
  }

  /**
   * 로그아웃 처리 (클라이언트에서 토큰 삭제)
   * @returns 성공 메시지
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout() {
    // 서버 측에서는 특별한 처리 필요 없음
    // 클라이언트에서 토큰을 삭제하면 됨
    return {
      message: 'logout_success',
      data: null,
    };
  }
  
}