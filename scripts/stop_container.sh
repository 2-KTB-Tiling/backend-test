#!/bin/bash
echo "🔹 기존 컨테이너 중지 중..."
docker stop backend || true
docker rm backend || true
echo "✅ 기존 컨테이너 중지 완료."
