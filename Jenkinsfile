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

        stage('Checkout Code') {
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
                    bat 'echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin'
                }
            }
        }

        stage('Build Image') {
            steps {
                bat 'docker build -t %IMAGE_NAME% .'
            }
        }

        stage('Push Image') {
            steps {
                bat 'docker push %IMAGE_NAME%'
            }
        }

        stage('Deploy on EC2 (SSH Agent)') {
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
                    sshagent(credentials: ['ec2-ssh']) {
                        bat """
                        ssh -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% ^
                        "docker login -u %DOCKER_USER% -p %DOCKER_PASS% && \
                         docker pull %IMAGE_NAME% && \
                         docker stop %CONTAINER_NAME% || true && \
                         docker rm %CONTAINER_NAME% || true && \
                         docker run -d \
                            --name %CONTAINER_NAME% \
                            -p %HOST_PORT%:%APP_PORT% \
                            -e MONGO_URL=%MONGO_URL% \
                            -e JWT_SECRET=%JWT_SECRET% \
                            -e GOOGLE_CLIENT_ID=%GOOGLE_CLIENT_ID% \
                            -e GOOGLE_CLIENT_SECRET=%GOOGLE_CLIENT_SECRET% \
                            -e GOOGLE_CALLBACK_URL=%GOOGLE_CALLBACK_URL% \
                            -e NODE_ENV=production \
                            --restart unless-stopped \
                            %IMAGE_NAME%"
                        """
                    }
                }
            }
        }

        stage('Verify') {
            steps {
                sshagent(credentials: ['ec2-ssh']) {
                    bat 'ssh %EC2_USER%@%EC2_HOST% "docker ps | grep skillsync"'
                }
            }
        }
    }

    post {
        success {
            echo "✅ Deployment successful"
        }
        failure {
            echo "❌ Deployment failed"
        }
    }
}
