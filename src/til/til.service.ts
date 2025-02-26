// src/til/til.service.ts
import { Injectable, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ConvertTilDto } from './dto/convert-til.dto';
import { EnhanceTilDto } from './dto/enhance-til.dto';

@Injectable()
export class TilService {
  private readonly logger = new Logger(TilService.name);
  private readonly llmApiUrl: string;
  private readonly llmApiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.llmApiUrl = this.configService.get<string>('LLM_API_URL') || 'http://llm-server:5000/api/v1';
    this.llmApiKey = this.configService.get<string>('LLM_API_KEY') || ''; // 유니스한테 키 받아오기!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  }

  /**
   * TIL 내용을 Markdown으로 변환
   */
  async convertToMarkdown(user: any, convertTilDto: ConvertTilDto) {
    try {
      const response = await firstValueFrom(this.httpService.post(
        `${this.llmApiUrl}/summation`,
        {
          ...convertTilDto,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.llmApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      ));

      return response.data;
    } catch (error) {
      this.handleApiError(error, 'Markdown 변환 중 오류가 발생했습니다.');
    }
  }

  /**
   * TIL 내용을 분석하여 키워드 추출 및 이미지 추천
   */
  async enhanceTil(user: any, enhanceTilDto: EnhanceTilDto) {
    try {
      const response = await firstValueFrom(this.httpService.post(
        `${this.llmApiUrl}/enhance`,
        {
          ...enhanceTilDto,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.llmApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      ));

      return response.data;
    } catch (error) {
      this.handleApiError(error, 'TIL 향상 중 오류가 발생했습니다.');
    }
  }

  /**
   * API 오류 처리
   */
  private handleApiError(error: any, defaultMessage: string) {
    this.logger.error(`LLM API 오류: ${error.message}`, error.stack);
    
    if (error.response) {
      // LLM 서버에서 응답을 받았지만 오류 상태 코드를 반환한 경우
      const statusCode = error.response.status;
      let errorMessage = defaultMessage;
      
      if (statusCode === 400) {
        errorMessage = 'invalid_request';
      } else if (statusCode >= 500) {
        errorMessage = 'llm_server_error';
      } else {
        errorMessage = error.response?.data?.message || defaultMessage;
      }
      
      throw new HttpException(
        { message: errorMessage, data: null },
        statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } else if (error.request) {
      // 요청은 보냈지만 응답을 받지 못한 경우
      throw new HttpException(
        { message: 'llm_server_error', data: null },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    } else {
      // 요청 자체를 보내지 못한 경우
      throw new HttpException(
        { message: 'llm_server_error', data: null },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}