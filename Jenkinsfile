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
                    bat "echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin"
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                bat "docker build -t %IMAGE_NAME% ."
            }
        }

        // --- NEW STAGE START ---
        stage('Trivy Image Scan') {
            steps {
                echo "Scanning image for vulnerabilities..."
                // This command scans the image and outputs a table. 
                // '--exit-code 0' ensures the pipeline continues even if vulnerabilities are found.
                // Change it to '--exit-code 1' if you want to FAIL the build when High/Critical issues exist.
                bat "trivy image --severity HIGH,CRITICAL --exit-code 0 %IMAGE_NAME%"
            }
        }
        // --- NEW STAGE END ---

        stage('Push Docker Image') {
            steps {
                bat "docker push %IMAGE_NAME%"
            }
        }
    }

    post {
        success {
            echo "✅ Docker image built, scanned, and pushed successfully"
        }
        failure {
            echo "❌ Pipeline failed"
        }
    }
}
