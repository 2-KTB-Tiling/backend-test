# # 빌드 스테이지
# FROM node:18-alpine AS builder
# WORKDIR /app
# COPY package.json package-lock.json ./
# RUN npm install
# COPY . .
# ARG JWT_SECRET

# RUN npm run build

# # 실행 스테이지
# FROM node:18-alpine
# WORKDIR /app
# COPY --from=builder /app/dist ./dist
# COPY package.json ./
# RUN npm install --only=production
# EXPOSE 3000
# CMD ["node", "dist/main"]


# 1️⃣ 빌드 스테이지
FROM node:18-alpine AS builder
WORKDIR /app

# 패키지 설치
COPY package.json package-lock.json ./
RUN npm install

# 소스 코드 복사
COPY . .

# 🔥 빌드 과정에서 환경 변수 전달
ARG JWT_SECRET
ENV JWT_SECRET=${JWT_SECRET}

RUN npm run build

# 2️⃣ 실행 스테이지
FROM node:18-alpine
WORKDIR /app

# 🔥 실행 스테이지에서도 환경 변수 유지
ENV JWT_SECRET=${JWT_SECRET}

# 빌드된 파일 및 필요한 파일만 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

# 포트 설정
EXPOSE 3000

# 실행 명령
CMD ["node", "dist/main"]
