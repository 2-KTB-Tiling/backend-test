pipeline {
    agent any

    environment {
        DOCKER_HUB_REPO = "luckyprice1103/tiling-backend"
        S3_BUCKET = "til-deployment-bucket"
        AWS_REGION = "ap-northeast-2"
        CODEDEPLOY_APP = "TIL-project"
        CODEDEPLOY_GROUP = "TIL-deploy-group"
    }

    stages {
        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Checkout Code') {
            steps {
                git branch: 'main', credentialsId: 'github_token', url: 'https://github.com/2-KTB-Tiling/backend-test.git'
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

        stage('Get Latest Version & Set New Tag') {
            steps {
                script {
                    def latestTag = sh(script: "curl -s https://hub.docker.com/v2/repositories/${DOCKER_HUB_REPO}/tags | jq -r '.results | map(select(.name | test(\"v[0-9]+\\\\.[0-9]+\"))) | sort_by(.last_updated) | .[-1].name'", returnStdout: true).trim()
                    
                    def newVersion
                    if (latestTag == "null" || latestTag == "") {
                        newVersion = "v1.0"  // 첫 번째 버전
                    } else {
                        def versionParts = latestTag.replace("v", "").split("\\.")
                        def major = versionParts[0].toInteger()
                        def minor = versionParts[1].toInteger() + 1
                        newVersion = "v${major}.${minor}"
                    }

                    env.NEW_TAG = newVersion
                    echo "New Image Tag: ${NEW_TAG}"
                }
            }
        }
        
        stage('Build & Push backend Image') {
            steps {
                withCredentials([file(credentialsId: 'back-key', variable: 'SECRET_ENV')]) {
                    script {
                        sh """
                        cp $SECRET_ENV .env
                        docker build -t ${DOCKER_HUB_REPO}:${NEW_TAG} --build-arg ENV_FILE=.env -f Dockerfile .
                        docker push ${DOCKER_HUB_REPO}:${NEW_TAG}
                        """
                    }
                }
            }
        }

        stage('Create Deployment Package') {
            steps {
                script {
                    sh """
                    echo "📦 배포 패키지 압축 중..."
                    zip -r deployment.zip appspec.yml scripts/
                    aws s3 cp deployment.zip s3://${S3_BUCKET}/deployment.zip
                    echo "✅ 배포 패키지 S3 업로드 완료"
                    """
                }
            }
        }

        stage('Trigger CodeDeploy') {
            steps {
                script {
                    sh """
                    echo "🚀 AWS CodeDeploy 배포 시작..."
                    aws deploy create-deployment \
                        --application-name ${CODEDEPLOY_APP} \
                        --deployment-group-name ${CODEDEPLOY_GROUP} \
                        --s3-location bucket=${S3_BUCKET},bundleType=zip,key=deployment.zip
                    echo "✅ CodeDeploy 배포 요청 완료"
                    """
                }
            }
        }

        // stage('Update GitHub Deployment YAML') {
        //     steps {
        //         withCredentials([usernamePassword(credentialsId: 'github_token', 
        //             usernameVariable: 'GIT_USERNAME', 
        //             passwordVariable: 'GIT_PASSWORD')]) {
        //             script {
        //                 sh """
        //                 git clone https://github.com/2-KTB-Tiling/k8s-manifests.git
        //                 cd k8s-manifests
        //                 sed -i 's|image: luckyprice1103/tiling-backend:.*|image: luckyprice1103/tiling-backend:${NEW_TAG}|' deployment.yaml
        //                 git config --global user.email "luckyprice1103@naver.com"
        //                 git config --global user.name "luckyPrice"
        //                 git add deployment.yaml
        //                 git commit -m "Update frontend image to ${NEW_TAG}"
        //                 git push https://${GIT_USERNAME}:${GIT_PASSWORD}@github.com/2-KTB-Tiling/k8s-manifests.git main
        //                 """
        //             }
        //         }
        //     }
        // }
    }
}
