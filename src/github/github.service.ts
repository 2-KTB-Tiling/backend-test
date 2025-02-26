// src/github/github.service.ts
import { Injectable, BadRequestException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { Octokit } from 'octokit';
import { AuthService } from '../auth/auth.service';
import { Repository, RepositoryStore } from './interfaces/repository.interface';

@Injectable()
export class GithubService {
  // 사용자 ID를 키로 사용하여 레포지토리 정보를 메모리에 저장
  private repositoryStore: RepositoryStore = {};

  constructor(
    private authService: AuthService
  ) {}

  /**
   * GitHub 레포지토리 URL을 파싱하여 owner와 repo 이름을 추출
   * @param repositoryUrl GitHub 레포지토리 URL
   * @returns 파싱된 레포지토리 정보
   */
  parseRepositoryUrl(repositoryUrl: string): Repository {
    try {
      // URL 유효성 검사
      if (!repositoryUrl || !repositoryUrl.includes('github.com')) {
        throw new BadRequestException('유효한 GitHub 레포지토리 URL이 아닙니다.', 'invalid_repository_url');
      }

      // URL에서 사용자명과 레포지토리 이름 추출
      // GitHub URL 형식: https://github.com/owner/repo
      const url = new URL(repositoryUrl);
      const pathSegments = url.pathname.split('/').filter(segment => segment.length > 0);
      
      // 경로 세그먼트가 최소 2개 이상이어야 함 (owner/repo)
      if (pathSegments.length < 2) {
        throw new BadRequestException('GitHub URL 형식이 올바르지 않습니다.', 'invalid_repository_url');
      }

      // owner와 repo 추출
      const owner = pathSegments[0];
      const repo = pathSegments[1];

      // 유효성 추가 검사
      if (!owner || !repo) {
        throw new BadRequestException('GitHub URL에서 소유자나 레포지토리 이름을 추출할 수 없습니다.', 'invalid_repository_url');
      }

      return { owner, repo };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // URL 파싱 오류 등 다른 오류 처리
      throw new BadRequestException('GitHub 레포지토리 URL 파싱 중 오류가 발생했습니다.', 'invalid_repository_url');
    }
  }

  /**
   * 특정 사용자의 GitHub 레포지토리 정보 저장
   * @param userId 사용자 ID
   * @param repository 레포지토리 정보
   */
  storeRepositoryInfo(userId: number, repository: Repository): void {
    this.repositoryStore[userId] = repository;
    console.log(`레포지토리 정보가 저장되었습니다. 사용자 ID: ${userId}, 레포지토리: ${repository.owner}/${repository.repo}`);
  }

  /**
   * 특정 사용자의 GitHub 레포지토리 정보 조회
   * @param userId 사용자 ID
   * @returns 레포지토리 정보 또는 null
   */
  getRepositoryInfo(userId: number): Repository | null {
    return this.repositoryStore[userId] || null;
  }

  /**
   * Markdown 파일을 GitHub 저장소에 업로드
   * @param userId 사용자 ID
   * @param path 파일 경로 (예: 'docs/til/javascript.md')
   * @param content 파일 내용
   * @param commitMessage 커밋 메시지
   * @returns 업로드된 파일의 GitHub URL
   */
  async uploadMarkdownFile(
    userId: number,
    path: string,
    content: string,
    commitMessage: string = 'Add TIL via TIL Converter'
  ): Promise<{ url: string }> {
    // 1. GitHub 토큰 가져오기
    const githubToken = this.authService.getGithubToken(userId);
    if (!githubToken) {
      throw new UnauthorizedException(
        '유효한 GitHub 토큰이 없습니다. 다시 로그인해주세요.',
        'github_token_missing'
      );
    }

    // 2. 레포지토리 정보 가져오기
    const repository = this.getRepositoryInfo(userId);
    if (!repository) {
      throw new BadRequestException(
        '등록된 GitHub 레포지토리가 없습니다. 먼저 레포지토리 URL을 등록해주세요.',
        'repository_not_found'
      );
    }

    try {
      // 3. Octokit 인스턴스 생성
      const octokit = new Octokit({ auth: githubToken });

      // 4. 파일 내용 Base64 인코딩
      const contentEncoded = Buffer.from(content).toString('base64');

      // 5. 파일 존재 여부 확인 (에러 처리를 위함)
      let sha: string | undefined;
      try {
        const { data: existingFile } = await octokit.rest.repos.getContent({
          owner: repository.owner,
          repo: repository.repo,
          path,
        });

        // 단일 파일인 경우에만 sha 추출
        if (!Array.isArray(existingFile)) {
          sha = existingFile.sha;
        }
      } catch (error) {
        // 파일이 없는 경우 무시 (새 파일로 생성)
        if (error.status !== 404) {
          throw error;
        }
      }

      // 6. 파일 생성 또는 업데이트
      const response = await octokit.rest.repos.createOrUpdateFileContents({
        owner: repository.owner,
        repo: repository.repo,
        path,
        message: commitMessage,
        content: contentEncoded,
        sha, // 파일 업데이트 시 필요
      });

      // 7. 생성된 파일의 HTML URL 반환
      const fileUrl = `https://github.com/${repository.owner}/${repository.repo}/blob/main/${path}`;
      return { url: fileUrl };
    } catch (error) {
      console.error('GitHub 파일 업로드 오류:', error);
      
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      
      if (error.status === 404) {
        throw new BadRequestException(
          '저장소를 찾을 수 없습니다. 저장소 이름을 확인해주세요.',
          'repository_not_found'
        );
      }
      
      if (error.message.includes('Bad credentials')) {
        throw new UnauthorizedException(
          'GitHub 인증 오류. 다시 로그인해주세요.',
          'github_token_invalid'
        );
      }
      
      throw new InternalServerErrorException(
        'GitHub 파일 업로드 중 오류가 발생했습니다.',
        'github_upload_error'
      );
    }
  }
}