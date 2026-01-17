pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "yashwagh30/skillsync:latest"
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
                withCredentials([string(credentialsId: 'DOCKER_PASS', variable: 'DOCKER_PASS')]) {
                    bat '''
                        echo %DOCKER_PASS% | docker login -u yashwagh30 --password-stdin
                    '''
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                bat '''
                    docker build -t %DOCKER_IMAGE% .
                '''
            }
        }

        stage('Push Docker Image') {
            steps {
                bat '''
                    docker push %DOCKER_IMAGE%
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Build & Push completed successfully'
        }
        failure {
            echo '❌ Pipeline failed'
        }
    }
}
