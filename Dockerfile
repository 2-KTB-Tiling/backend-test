# # 빌드 스테이지
# FROM node:18-alpine AS builder
# WORKDIR /app
# COPY package.json package-lock.json ./
# RUN npm install
# COPY . .

# RUN npm run build

# # 실행 스테이지
# FROM node:18-alpine
# WORKDIR /app
# COPY --from=builder /app/dist ./dist
# COPY package.json ./
# RUN npm install --only=production
# EXPOSE 3000
# CMD ["node", "dist/main"]

# 🔹 빌드 스테이지
FROM node:18-alpine AS builder
WORKDIR /app

# 패키지 설치
COPY package.json package-lock.json ./
RUN npm install

# 소스 코드 복사
COPY . .

# 환경 변수 파일 복사 (Jenkins에서 제공)
ARG ENV_FILE
COPY ${ENV_FILE} .env

# 빌드 실행
RUN npm run build

# 🔹 실행 스테이지
FROM node:18-alpine
WORKDIR /app

# 빌드된 파일 복사
COPY --from=builder /app/dist ./dist
COPY package.json ./

# 프로덕션 패키지만 설치
RUN npm install --only=production

# 환경 변수 파일 복사
COPY --from=builder /app/.env .env

# 포트 설정
EXPOSE 3000

# 실행 명령
CMD ["node", "dist/main"]
