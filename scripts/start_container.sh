#!/bin/bash
DOCKER_HUB_REPO="luckyprice1103/tiling-backend"

# NEW_TAG 값 불러오기
if [ -f /home/ubuntu/backend/.deploy_env ]; then
    source /home/ubuntu/backend/.deploy_env
else
    echo "❌ ERROR: /home/ubuntu/backend/.deploy_env 파일을 찾을 수 없습니다!"
    exit 1
fi

# NEW_TAG 값이 비어 있으면 기본값 설정
if [ -z "$NEW_TAG" ]; then
    echo "❌ ERROR: NEW_TAG 값이 비어 있습니다! 기본값을 설정합니다."
    NEW_TAG="latest"
fi

echo "🔹 최신 Docker 이미지 Pull 중... (버전: ${NEW_TAG})"
docker pull ${DOCKER_HUB_REPO}:${NEW_TAG}

echo "🔹 기존 백엔드 컨테이너 중지 중..."
docker stop backend || true
docker rm backend || true

echo "🔹 새로운 백엔드 컨테이너 실행 중..."
docker run -d -p 3000:3000 --name backend ${DOCKER_HUB_REPO}:${NEW_TAG}

echo "✅ 백엔드 배포 완료!"
