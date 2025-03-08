#!/bin/bash
echo "🔹 시스템 패키지 업데이트..."
sudo apt update -y && sudo apt upgrade -y

echo "🔹 Docker 설치 확인..."
if ! command -v docker &> /dev/null
then
    echo "➡️ Docker가 설치되지 않음. 설치 진행..."
    sudo apt install -y docker.io
    sudo systemctl start docker
    sudo systemctl enable docker
else
    echo "✅ Docker 이미 설치됨."
fi
