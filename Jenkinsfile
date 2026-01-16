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

        stage('Docker Login (Local)') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    bat '''
                        echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
                    '''
                }
            }
        }

        stage('Build Docker Image (Local)') {
            steps {
                bat '''
                    docker build -t %IMAGE_NAME% .
                '''
            }
        }

        stage('Push Docker Image (Local)') {
            steps {
                bat '''
                    docker push %IMAGE_NAME%
                '''
            }
        }

        stage('Deploy on EC2 via SSH') {
            steps {
                withCredentials([
                    file(credentialsId: 'ec2-pem', variable: 'EC2_KEY'),
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

                    bat """
                    echo ===============================
                    echo Fixing SSH key permissions
                    echo ===============================

                    copy "%EC2_KEY%" "%WORKSPACE%\\ec2.pem" >nul
                    icacls "%WORKSPACE%\\ec2.pem" /inheritance:r /grant:r "%USERNAME%:R" >nul

                    echo ===============================
                    echo Deploying on EC2
                    echo ===============================

                    ssh -i "%WORKSPACE%\\ec2.pem" -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% ^
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

        stage('Verify Deployment') {
            steps {
                bat """
                ssh -i "%WORKSPACE%\\ec2.pem" -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% ^
                "docker ps | grep %CONTAINER_NAME%"
                """
            }
        }
    }

    post {
        success {
            echo "✅ Deployment successful on EC2"
        }
        failure {
            echo "❌ Deployment failed. Check Jenkins logs."
        }
    }
}
