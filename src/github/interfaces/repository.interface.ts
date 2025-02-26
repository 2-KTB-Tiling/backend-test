// src/github/interfaces/repository.interface.ts

/**
 * GitHub 레포지토리 정보를 정의하는 인터페이스
 */
export interface Repository {
    owner: string;    // GitHub 레포지토리 소유자 (사용자명)
    repo: string;     // 레포지토리 이름
  }
  
  /**
   * 사용자별 레포지토리 저장소를 정의하는 인터페이스
   */
  export interface RepositoryStore {
    [userId: number]: Repository;
  }
  
  /**
   * 레포지토리 URL 파싱 응답 인터페이스
   */
  export interface ParseUrlResponse {
    message: string;
    data: Repository | null;
  }