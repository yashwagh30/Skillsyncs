pipeline {
    agent any

    environment {
        IMAGE_NAME     = "yashwagh30/skillsync:latest"
        CONTAINER_NAME = "skillsync"

        APP_PORT  = "5008"
        HOST_PORT = "8081"

        EC2_USER = "ubuntu"
        EC2_HOST = "13.201.53.54"
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/yashwagh30/SkillSyncs.git'
            }
        }

        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    bat 'wsl echo $DOCKER_PASS | wsl docker login -u $DOCKER_USER --password-stdin'
                }
            }
        }

        stage('Build Image') {
            steps {
                bat 'wsl docker build -t yashwagh30/skillsync:latest .'
            }
        }

        stage('Push Image') {
            steps {
                bat 'wsl docker push yashwagh30/skillsync:latest'
            }
        }

        stage('Deploy on EC2 (via WSL SSH)') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    ),
                    string(credentialsId: 'MONGO_URL', variable: 'MONGO_URL'),
                    string(credentialsId: 'JWT_SECRET', variable: 'JWT_SECRET'),
                    string(credentialsId: 'GOOGLE_CLIENT_ID', variable: 'GOOGLE_CLIENT_ID'),
                    string(credentialsId: 'GOOGLE_CLIENT_SECRET', variable: 'GOOGLE_CLIENT_SECRET'),
                    string(credentialsId: 'GOOGLE_CALLBACK_URL', variable: 'GOOGLE_CALLBACK_URL')
                ]) {
                    bat '''
                    wsl ssh -i ~/.ssh/ec2.pem -o StrictHostKeyChecking=no ubuntu@13.201.53.54 "
                      docker login -u $DOCKER_USER -p $DOCKER_PASS &&
                      docker pull yashwagh30/skillsync:latest &&
                      docker stop skillsync || true &&
                      docker rm skillsync || true &&
                      docker run -d \
                        --name skillsync \
                        -p 8081:5008 \
                        -e MONGO_URL=$MONGO_URL \
                        -e JWT_SECRET=$JWT_SECRET \
                        -e GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID \
                        -e GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET \
                        -e GOOGLE_CALLBACK_URL=$GOOGLE_CALLBACK_URL \
                        -e NODE_ENV=production \
                        --restart unless-stopped \
                        yashwagh30/skillsync:latest
                    "
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "✅ Deployment successful via WSL"
        }
        failure {
            echo "❌ Deployment failed"
        }
    }
}
