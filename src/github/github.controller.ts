// src/github/github.controller.ts
import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { GithubService } from './github.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ParseUrlResponse } from './interfaces/repository.interface';

// GitHub 레포지토리 URL 파싱을 위한 DTO
interface ParseRepositoryUrlDto {
  repository_url: string;
}

@Controller()
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  /**
   * GitHub 레포지토리 URL 파싱 및 저장 
   * @param parseUrlDto 레포지토리 URL을 포함한 DTO
   * @param req 인증된 요청 객체
   * @returns 파싱된 레포지토리 정보
   */
  @Post('parse/github-url')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async parseGithubUrl(
    @Body() parseUrlDto: ParseRepositoryUrlDto,
    @Req() req
  ): Promise<ParseUrlResponse> {
    try {
      // URL 유효성 검사
      if (!parseUrlDto.repository_url) {
        throw new BadRequestException('GitHub 레포지토리 URL이 필요합니다.', 'invalid_repository_url');
      }

      // URL 파싱
      const repositoryInfo = this.githubService.parseRepositoryUrl(parseUrlDto.repository_url);
      
      // 파싱된 정보 저장 (사용자 ID를 키로 사용)
      const userId = req.user.sub; // JWT 토큰에서 추출한 사용자 ID
      this.githubService.storeRepositoryInfo(userId, repositoryInfo);

      // 성공 응답 반환
      return {
        message: 'parse_success',
        data: repositoryInfo
      };
    } catch (error) {
      // 오류 종류에 따른 응답 처리
      if (error instanceof BadRequestException) {
        throw error; // BadRequestException은 그대로 전달
      }
      
      console.error('GitHub URL 파싱 오류:', error);
      throw new InternalServerErrorException('서버 오류가 발생했습니다.', 'internal_server_error');
    }
  }
}