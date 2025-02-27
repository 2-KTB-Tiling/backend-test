pipeline {
    agent any

    environment {
        DOCKER_HUB_REPO = "luckyprice1103/tiling-backend"
    }

    stages {
        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Checkout Code') {
            steps {
                git branch: 'main', credentialsId: 'github_token', url: 'https://github.com/2-KTB-Tiling/Backend.git'
            }
        }

        stage('Login to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', 
                    usernameVariable: 'DOCKER_HUB_USERNAME', 
                    passwordVariable: 'DOCKER_HUB_PASSWORD')]) {
                    script {
                        sh 'echo "$DOCKER_HUB_PASSWORD" | docker login -u "$DOCKER_HUB_USERNAME" --password-stdin'
                    }
                }
            }
        }

        stage('Build & Push Backend Image') {
            steps {
                script {
                    sh """
                    docker build -t ${DOCKER_HUB_REPO}:latest -f Dockerfile .
                    docker push ${DOCKER_HUB_REPO}:latest
                    """
                }
            }
        }

        stage('Update GitHub Deployment YAML') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'github_token', 
                    usernameVariable: 'GIT_USERNAME', 
                    passwordVariable: 'GIT_PASSWORD')]) {
                    script {
                        sh """
                        git clone https://github.com/2-KTB-Tiling/k8s-manifests.git
                        cd k8s-manifests
                        sed -i 's|image: luckyprice1103/tiling-backend:.*|image: luckyprice1103/tiling-backend:${NEW_TAG}|' backend-deployment.yaml
                        git config --global user.email "luckyprice1103@naver.com"
                        git config --global user.name "luckyPrice"
                        git add backend-deployment.yaml
                        git commit -m "Update backend image to ${NEW_TAG}"
                        git push https://${GIT_USERNAME}:${GIT_PASSWORD}@github.com/2-KTB-Tiling/k8s-manifests.git main
                        """
                    }
                }
            }
        }
    }
}
