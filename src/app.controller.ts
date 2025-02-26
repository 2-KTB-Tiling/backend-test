// app.controller.ts에 추가
import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(private configService: ConfigService) {}

  @Get('login-github')
  startGithubLogin(@Res() res: Response) {
    // GitHub OAuth 설정값 가져오기
    const clientId = this.configService.get<string>('GITHUB_CLIENT_ID') || '';
    const redirectUri = this.configService.get<string>('GITHUB_CALLBACK_URL') || '';
    
    // 값이 없으면 오류 메시지 표시
    if (!clientId || !redirectUri) {
      return res.status(500).send(`
        <html>
          <head><title>설정 오류</title></head>
          <body>
            <h1>설정 오류</h1>
            <p>GitHub OAuth 설정이 완료되지 않았습니다. 환경 변수를 확인하세요.</p>
          </body>
        </html>
      `);
    }
    
    // 확장된 스코프로 GitHub OAuth URL 생성
    const scope = 'repo,user:email'; // repo 스코프 추가
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
    
    // 로그인 페이지 반환
    return res.send(`
      <html>
        <head><title>GitHub 로그인</title></head>
        <body>
          <h1>GitHub 로그인</h1>
          <p>아래 버튼을 클릭하여 GitHub으로 로그인하세요.</p>
          <p>저장소 접근 권한(repo)을 포함한 확장된 권한을 요청합니다.</p>
          <a href="${githubAuthUrl}" style="display: inline-block; background-color: #2da44e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            GitHub으로 로그인
          </a>
        </body>
      </html>
    `);
  }

  // 기존 코드...
  @Get('login-success')
  loginSuccess(@Query('token') token: string, @Query('userId') userId: string, @Res() res: Response) {
    // HTML 페이지 반환
    return res.send(`
      <html>
        <head><title>로그인 성공</title></head>
        <body>
          <h1>로그인 성공!</h1>
          <p>토큰이 발급되었습니다. 이 페이지는 개발 중에만 사용됩니다.</p>
          <p>토큰: ${token}</p>
          <p>사용자 ID: ${userId}</p>
          <script>
            // 토큰을 로컬 스토리지에 저장
            localStorage.setItem('auth_token', '${token}');
            console.log('토큰이 저장되었습니다:', '${token}');
          </script>
        </body>
      </html>
    `);
  }

  @Get('login-error')
  loginError(@Query('error') error: string, @Res() res: Response) {
    return res.send(`
      <html>
        <head><title>로그인 실패</title></head>
        <body>
          <h1>로그인 실패</h1>
          <p>오류: ${error || '알 수 없는 오류'}</p>
        </body>
      </html>
    `);
  }
}