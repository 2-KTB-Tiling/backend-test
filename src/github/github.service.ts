// src/github/github.service.ts
import { Injectable, BadRequestException, UnauthorizedException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { Repository, RepositoryStore } from './interfaces/repository.interface';
import { createDateBasedPath, createDateBasedFilename, createFullDateBasedPath } from '../common/utils/date-path.utils';

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
      let repo = pathSegments[1];

      // .git 확장자 제거
      if (repo.endsWith('.git')) {
        repo = repo.slice(0, -4); // '.git' 부분 제거
      }

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
      // 4. 파일 내용 Base64 인코딩
      const contentEncoded = Buffer.from(content).toString('base64');

      // 5. 파일 존재 여부 확인 (에러 처리를 위함)
      let sha: string | undefined;
      try {
        const response = await fetch(`https://api.github.com/repos/${repository.owner}/${repository.repo}/contents/${path}`, {
          method: 'GET',
          headers: this.getGitHubHeaders(githubToken)
        });

        if (response.ok) {
          const data = await response.json();
          // 단일 파일인 경우에만 sha 추출
          if (!Array.isArray(data)) {
            sha = data.sha;
          }
        } else if (response.status !== 404) {
          throw new Error(`GitHub API 오류: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        // 파일이 없는 경우 무시 (새 파일로 생성)
        if (error.status !== 404) {
          throw error;
        }
      }

      // 6. 파일 생성 또는 업데이트
      const createResponse = await fetch(`https://api.github.com/repos/${repository.owner}/${repository.repo}/contents/${path}`, {
        method: 'PUT',
        headers: this.getGitHubHeaders(githubToken),
        body: JSON.stringify({
          message: commitMessage,
          content: contentEncoded,
          sha // 파일 업데이트 시 필요
        })
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(`GitHub API 오류: ${createResponse.status} ${JSON.stringify(errorData)}`);
      }

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
      
      if (error.message && error.message.includes('Bad credentials')) {
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

  /**
   * Markdown 파일을 GitHub 저장소에 현재 날짜 기반 경로로 업로드
   * @param userId 사용자 ID
   * @param content Markdown 내용
   * @param customPath 사용자 정의 경로 (옵션)
   * @param commitMessage 커밋 메시지
   * @returns 업로드된 파일의 GitHub URL
   */
  async uploadMarkdownToDatePath(
    userId: number,
    content: string,
    customPath?: string,
    commitMessage: string = 'Add TIL via TIL Converter'
  ): Promise<{ url: string }> {
    console.log('업로드 요청 - 사용자 ID:', userId);
    this.authService.debugTokenStore();
    
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
      // 3. 경로 생성 (현재 날짜 기준 또는 사용자 지정)
      const date = new Date();
      const filePath = customPath || createFullDateBasedPath(date);
      
      // 4. 파일 내용 Base64 인코딩
      const contentEncoded = Buffer.from(content).toString('base64');
      
      // 5. 디렉토리 생성 로직 제거
      // 이 부분을 제거: await this.ensureDirectoryExists(...);
      
      // 6. 파일 존재 여부 확인 (업데이트 시 필요)
      let sha: string | undefined;
      try {
        const response = await fetch(`https://api.github.com/repos/${repository.owner}/${repository.repo}/contents/${filePath}`, {
          method: 'GET',
          headers: this.getGitHubHeaders(githubToken)
        });
  
        if (response.ok) {
          const data = await response.json();
          if (!Array.isArray(data)) {
            sha = data.sha;
          }
        }
      } catch (error) {
        // 파일이 없는 경우 무시 (새 파일로 생성)
        console.log('파일이 없어 새로 생성합니다.');
      }
  
      // 7. 파일 생성 또는 업데이트
      console.log(`파일 생성/업데이트 시작: ${filePath}`);
      const createResponse = await fetch(`https://api.github.com/repos/${repository.owner}/${repository.repo}/contents/${filePath}`, {
        method: 'PUT',
        headers: this.getGitHubHeaders(githubToken),
        body: JSON.stringify({
          message: commitMessage,
          content: contentEncoded,
          sha,
          branch: 'main'  // 명시적으로 브랜치 지정
        })
      });
  
      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        console.error('파일 생성 오류 응답:', errorData);
        throw new Error(`GitHub API 오류: ${createResponse.status} ${JSON.stringify(errorData)}`);
      }
  
      // 8. 생성된 파일의 HTML URL 반환
      const fileUrl = `https://github.com/${repository.owner}/${repository.repo}/blob/main/${filePath}`;
      return { url: fileUrl };
    } catch (error) {
      console.error('GitHub 파일 업로드 오류:', error);
      
      if (error instanceof UnauthorizedException || 
          error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      
      if (error.status === 404) {
        throw new BadRequestException(
          '저장소를 찾을 수 없습니다. 저장소 이름을 확인해주세요.',
          'repository_not_found'
        );
      }
      
      if (error.message && error.message.includes('Bad credentials')) {
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

  /**
   * GitHub API 요청에 필요한 헤더를 생성합니다.
   * @param token GitHub 토큰
   * @returns HTTP 헤더
   */
  private getGitHubHeaders(token: string): HeadersInit {
    return {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Tiling-App'
    };
  }

  /**
   * GitHub 저장소에 디렉토리 구조가 존재하는지 확인하고, 없으면 생성
   * @param token GitHub 토큰
   * @param owner 저장소 소유자
   * @param repo 저장소 이름
   * @param dirPath 확인할 디렉토리 경로 (예: '2023/Jan/')
   */
  private async ensureDirectoryExists(
    token: string, 
    owner: string, 
    repo: string, 
    dirPath: string
  ): Promise<void> {
    // 경로 끝의 슬래시 제거
    dirPath = dirPath.replace(/\/+$/, '');
    console.log('디렉토리 확인/생성:', { owner, repo, dirPath });
    
    // 경로를 세그먼트로 분리
    const segments = dirPath.split('/').filter(segment => segment.length > 0);
    let currentPath = '';
    
    // 각 세그먼트별로 디렉토리 존재 여부 확인 및 생성
    for (const segment of segments) {
      currentPath += segment;
      
      try {
        // 디렉토리 존재 여부 확인
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${currentPath}`, {
          method: 'GET',
          headers: this.getGitHubHeaders(token)
        });
  
        // 디렉토리가 존재하면 다음 세그먼트로 진행
        if (response.ok) {
          currentPath += '/';
          continue;
        }
        
        // 404 오류면 디렉토리가 없는 것이므로 생성
        if (response.status === 404) {
          console.log(`디렉토리 생성: ${currentPath}`);
          
          // 빈 .gitkeep 파일 생성을 통해 디렉토리 생성
          const createResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${currentPath}/.gitkeep`, {
            method: 'PUT',
            headers: this.getGitHubHeaders(token),
            body: JSON.stringify({
              message: `Create directory ${currentPath}`,
              content: 'Cg==', // 빈 파일 내용(Base64 인코딩)
              branch: 'main' // 명시적으로 브랜치 지정
            })
          });
  
          if (!createResponse.ok) {
            const errorData = await createResponse.json();
            console.error(`디렉토리 생성 응답:`, errorData);
            throw new Error(`디렉토리 생성 오류: ${createResponse.status} ${JSON.stringify(errorData)}`);
          }
        } else {
          // 다른 HTTP 오류
          const errorData = await response.json();
          throw new Error(`GitHub API 오류: ${response.status} ${JSON.stringify(errorData)}`);
        }
      } catch (error) {
        console.error(`디렉토리 작업 오류: ${currentPath}`, error);
        throw error;
      }
      
      // 다음 세그먼트로 이동하기 전에 슬래시 추가
      currentPath += '/';
    }
  }
}