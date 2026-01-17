pipeline {
    agent any

    environment {
        IMAGE_NAME = "yashwagh30/skillsync:latest"
        CONTAINER  = "skillsync"
        APP_PORT   = "5008"
        HOST_PORT  = "8081"
        AWS_REGION = "ap-south-1"
        INSTANCE_ID = "i-0890fbd5d5c379df6"
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/yashwagh30/Skillsyncs.git'
            }
        }

        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    bat '''
                    echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
                    '''
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

        stage('Deploy via AWS SSM') {
            steps {
                withCredentials([
                    [$class: 'AmazonWebServicesCredentialsBinding',
                     credentialsId: 'aws-creds'],
                    string(credentialsId: 'MONGO_URL', variable: 'MONGO_URL'),
                    string(credentialsId: 'JWT_SECRET', variable: 'JWT_SECRET'),
                    string(credentialsId: 'GOOGLE_CLIENT_ID', variable: 'GOOGLE_CLIENT_ID'),
                    string(credentialsId: 'GOOGLE_CLIENT_SECRET', variable: 'GOOGLE_CLIENT_SECRET'),
                    string(credentialsId: 'GOOGLE_CALLBACK_URL', variable: 'GOOGLE_CALLBACK_URL')
                ]) {
                    bat """
aws ssm send-command ^
 --region %AWS_REGION% ^
 --instance-ids %INSTANCE_ID% ^
 --document-name "AWS-RunShellScript" ^
 --parameters commands='[
   "docker login -u %DOCKER_USER% -p %DOCKER_PASS%",
   "docker pull %IMAGE_NAME%",
   "docker stop %CONTAINER% || true",
   "docker rm %CONTAINER% || true",
   "docker run -d --name %CONTAINER% -p %HOST_PORT%:%APP_PORT% ^
     -e MONGO_URL=%MONGO_URL% ^
     -e JWT_SECRET=%JWT_SECRET% ^
     -e GOOGLE_CLIENT_ID=%GOOGLE_CLIENT_ID% ^
     -e GOOGLE_CLIENT_SECRET=%GOOGLE_CLIENT_SECRET% ^
     -e GOOGLE_CALLBACK_URL=%GOOGLE_CALLBACK_URL% ^
     -e NODE_ENV=production ^
     --restart unless-stopped %IMAGE_NAME%"
 ]'
"""
                }
            }
        }
    }

    post {
        success {
            echo "✅ Deployment successful via AWS SSM"
        }
        failure {
            echo "❌ Deployment failed"
        }
    }
}
