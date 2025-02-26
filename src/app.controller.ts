// GIthub에서 엑세스 토큰을 받기 위한 임시 컨트롤러
// 프론트 연결시 삭제해야함
import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class AppController {
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