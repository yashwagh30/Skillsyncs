pipeline {
    agent any

    environment {
        IMAGE_NAME = "yashwagh30/skillsync:latest"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/yashwagh30/Skillsyncs.git'
            }
        }

        stage('Docker Login') {
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

        stage('Build Docker Image') {
            steps {
                bat '''
                    docker build -t %IMAGE_NAME% .
                '''
            }
        }

        stage('Push Docker Image') {
            steps {
                bat '''
                    docker push %IMAGE_NAME%
                '''
            }
        }
    }

    post {
        success {
            echo "✅ Docker image built and pushed successfully"
        }
        failure {
            echo "❌ Pipeline failed"
        }
    }
}
