#!/bin/bash
DOCKER_HUB_REPO="luckyprice1103/tiling-backend"

echo "🔹 최신 Docker 이미지 Pull 중..."
docker pull ${DOCKER_HUB_REPO}:latest

echo "🔹 새로운 컨테이너 실행 중..."
docker run -d -p 3000:3000 --name backend ${DOCKER_HUB_REPO}:latest

echo "✅ 배포 완료!"
