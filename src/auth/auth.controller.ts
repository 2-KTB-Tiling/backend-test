// src/auth/auth.controller.ts
import { Controller, Post, Body, Get, UseGuards, Req, HttpCode, HttpStatus, Query, Res, Redirect , BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GithubLoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthResponse } from './interface/github-user.interface';
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
  
  /**
   * GitHub OAuth 콜백 URL 핸들러
   * GitHub 인증 후 리디렉션되는 endpoint
   * @param code GitHub에서 제공하는 인증 코드
   * @param res Express Response 객체
   */
  @Get('github/callback')
  async githubCallback(@Query('code') code: string, @Res() res: Response) {
    try {
      // 1. 인증 코드 유효성 검사
      if (!code) {
        throw new BadRequestException('GitHub 인증 코드가 필요합니다.', 'invalid_request');
      }
      
      // 2. 서비스를 통해 GitHub 콜백 처리
      const { redirectUrl } = await this.authService.handleGithubCallback(code);
      
      // 3. 프론트엔드 페이지로 리디렉션 (토큰 포함)
      return res.redirect(redirectUrl);
    } catch (error) {
      // 4. 에러 발생 시 로깅 및 에러 페이지로 리디렉션
      console.error('GitHub 콜백 처리 오류:', error);
      return res.redirect('http://localhost:3000/login-error?error=인증_처리_중_오류가_발생했습니다');
    }
  }
}