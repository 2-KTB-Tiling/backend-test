# 1. Node.js 18 버전 사용
FROM node:18

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. package.json 및 package-lock.json 복사 후 의존성 설치
COPY package.json package-lock.json ./
RUN npm install

# 4. 환경 변수 파일 복사 (Jenkins에서 제공)
ARG ENV_FILE
COPY ${ENV_FILE} .env

# 5. 모든 소스 코드 복사
COPY . .

# 6. 포트 설정 (기본 3000번)
EXPOSE 3000

# 7. 실행 명령어 (NestJS 앱 실행)
CMD ["npm", "run", "start"]
