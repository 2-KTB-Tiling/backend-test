// src/github/github.controller.ts 확장
import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { GithubService } from './github.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ParseUrlResponse } from './interfaces/repository.interface';

// GitHub 레포지토리 URL 파싱을 위한 DTO
interface ParseRepositoryUrlDto {
  repository_url: string;
}

// Markdown 업로드 DTO
interface UploadMarkdownDto {
  content: string;
  custom_path?: string;
  commit_message?: string;
}

// 업로드 응답 인터페이스
interface UploadResponse {
  message: string;
  data: {
    url: string;
  } | null;
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
    const userId = req.user.sub || req.user.id;
    console.log('요청 객체의 사용자 정보:', req.user);
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

  /**
   * Markdown 콘텐츠를 날짜 기반 경로로 GitHub 저장소에 업로드
   * @param uploadDto 업로드할 마크다운 콘텐츠를 포함한 DTO
   * @param req 인증된 요청 객체
   * @returns 업로드된 파일의 GitHub URL
   */
  @Post('upload/github')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async uploadToGithub(
    @Body() uploadDto: UploadMarkdownDto,
    @Req() req
  ): Promise<UploadResponse> {
    try {
      // 요청 유효성 검사
      if (!uploadDto.content) {
        throw new BadRequestException('업로드할 콘텐츠가 필요합니다.', 'content_required');
      }

      // JWT 토큰에서 사용자 ID 추출
      const userId = req.user.sub;
      
      // GitHub 저장소에 마크다운 업로드
      const result = await this.githubService.uploadMarkdownToDatePath(
        userId,
        uploadDto.content,
        uploadDto.custom_path,
        uploadDto.commit_message
      );

      // 성공 응답 반환
      return {
        message: 'upload_success',
        data: result
      };
    } catch (error) {
      console.error('GitHub 업로드 오류:', error);
      
      // 이미 특정 타입의 예외는 그대로 전달
      if (error instanceof BadRequestException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }
      
      // 그 외 예외는 500 에러로 변환
      throw new InternalServerErrorException(
        error.message || '서버 오류가 발생했습니다.',
        'upload_failed'
      );
    }
  }
}