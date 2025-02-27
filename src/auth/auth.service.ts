// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Octokit } from 'octokit';
import { GithubUser, AuthResponse, AuthUserData } from './interfaces/github-user.interface';

// 메모리에 토큰을 저장하기 위한 인터페이스
interface TokenStore {
  [userId: number]: {
    githubToken: string;
    expiresAt: Date;
  };
}

@Injectable()
export class AuthService {
  // 메모리 내 토큰 저장소
  private tokenStore: TokenStore = {};
  
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * GitHub 인증 코드를 사용하여 액세스 토큰을 요청하고 사용자 정보를 가져옵니다.
   * 항상 data가 null이 아닌 형태로 반환하도록 수정
   * @param code GitHub OAuth에서 받은 인증 코드
   * @returns 인증 응답 (토큰과 사용자 정보)
   */
  async loginWithGithub(code: string): Promise<AuthResponse> {
    try {
      // 코드 유효성 검사
      if (!code) {
        throw new BadRequestException('GitHub 인증 코드가 필요합니다.', 'invalid_request');
      }

      // GitHub OAuth 액세스 토큰 교환
      const githubToken = await this.exchangeCodeForToken(code);
      
      // GitHub 사용자 정보 가져오기
      const githubUser = await this.getGithubUserInfo(githubToken);
      
      // 사용자 데이터 가공
      const user = {
        id: githubUser.id,
        github_id: githubUser.login,
        email: githubUser.email || `${githubUser.login}@github.com`, // 이메일이 없을 경우 대체값
        avatar_url: githubUser.avatar_url,
      };

      // GitHub 토큰을 메모리에 저장 (사용자 ID를 키로 사용)
      this.storeGithubToken(githubUser.id, githubToken);

      // JWT 토큰 생성
      const access_token = this.generateJwtToken(user);

      // 응답 데이터 구성
      return {
        message: 'login_success',
        data: {
          access_token,
          user,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      } else if (error.message.includes('GitHub')) {
        throw new UnauthorizedException('유효하지 않은 GitHub 코드입니다.', 'invalid_github_code');
      } else {
        console.error('GitHub 로그인 오류:', error);
        throw new InternalServerErrorException('서버 오류가 발생했습니다.', 'internal_server_error');
      }
    }
  }

  /**
   * GitHub 인증 코드를 액세스 토큰으로 교환합니다.
   * @param code GitHub OAuth 인증 코드
   * @returns GitHub 액세스 토큰
   */
  private async exchangeCodeForToken(code: string): Promise<string> {
    try {
      const clientId = this.configService.get<string>('GITHUB_CLIENT_ID');
      const clientSecret = this.configService.get<string>('GITHUB_CLIENT_SECRET');

      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      });

      const data = await response.json();

      if (data.error || !data.access_token) {
        throw new UnauthorizedException('GitHub 토큰 교환에 실패했습니다: ' + (data.error_description || data.error), 'invalid_github_code');
      }

      return data.access_token;
    } catch (error) {
      throw new UnauthorizedException('GitHub 토큰 교환 중 오류가 발생했습니다.', 'invalid_github_code');
    }
  }

  /**
   * GitHub 액세스 토큰을 사용하여 사용자 정보를 가져옵니다.
   * @param token GitHub 액세스 토큰
   * @returns GitHub 사용자 정보
   */
  private async getGithubUserInfo(token: string): Promise<GithubUser> {
    try {
      const octokit = new Octokit({ auth: token });
      const { data } = await octokit.rest.users.getAuthenticated();
      
      return {
        id: data.id,
        login: data.login,
        name: data.name || data.login,
        email: data.email || '',
        avatar_url: data.avatar_url,
        html_url: data.html_url,
      };
    } catch (error) {
      throw new UnauthorizedException('GitHub 사용자 정보를 가져오는데 실패했습니다.', 'invalid_github_code');
    }
  }

  /**
   * 사용자 정보를 기반으로 JWT 토큰을 생성합니다.
   * @param user 사용자 정보
   * @returns JWT 액세스 토큰
   */
  private generateJwtToken(user: any): string {
    const payload = {
      sub: user.id,
      github_id: user.github_id,
      email: user.email,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '7d', // 토큰 만료 기간: 7일
    });
  }

  /**
   * JWT 토큰을 검증합니다.
   * @param token JWT 토큰
   * @returns 검증된 페이로드
   */
  verifyToken(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch (error) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }

  /**
   * 현재 로그인한 사용자 정보를 가져옵니다.
   * @param userId 사용자 ID
   * @returns 사용자 정보
   */
  async getCurrentUser(userId: number) {
    // 실제 구현에서는 사용자 DB에서 조회하는 로직 필요
    // 여기서는 간단히 가짜 데이터 반환
    return {
      id: userId,
      github_id: 'user123',
      email: 'user@example.com',
      avatar_url: 'https://github.com/user.png',
    };
  }


  /**
   * 사용자의 GitHub 액세스 토큰을 메모리에 저장
   * @param userId GitHub 사용자 ID
   * @param token GitHub 액세스 토큰
   */
  private storeGithubToken(userId: number, token: string): void {
    // 현재 시간에 7일을 더한 만료 시간 계산 (일반적인 GitHub 토큰 만료 기간)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // 토큰 저장
    this.tokenStore[userId] = {
      githubToken: token,
      expiresAt: expiresAt
    };
    
    console.log(`GitHub 토큰이 저장되었습니다. 사용자 ID: ${userId}`);
  }
  
  /**
   * 사용자의 GitHub 액세스 토큰 조회
   * @param userId GitHub 사용자 ID
   * @returns GitHub 액세스 토큰 또는 null
   */
  public getGithubToken(userId: number): string | null {
    const tokenData = this.tokenStore[userId];
    
    // 토큰이 없거나 만료된 경우
    if (!tokenData || new Date() > tokenData.expiresAt) {
      if (tokenData) {
        // 만료된 토큰 삭제
        delete this.tokenStore[userId];
        console.log(`토큰이 만료되었습니다. 사용자 ID: ${userId}`);
      }
      return null;
    }
    
    return tokenData.githubToken;
  }

  // github.service.ts에서 사용하는 디버깅 메서드
  public debugTokenStore(): void {
    console.log('현재 토큰 저장소 상태:', JSON.stringify(this.tokenStore, null, 2));
  }
  
  /**
   * GitHub 토큰 유효성 검사
   * @param userId GitHub 사용자 ID
   * @returns 토큰 유효 여부
   */
  public hasValidGithubToken(userId: number): boolean {
    return this.getGithubToken(userId) !== null;
  }
  
}