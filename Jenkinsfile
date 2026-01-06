pipeline {
    agent any

    environment {
        EC2_USER = "ubuntu"
        EC2_HOST = "43.205.254.44"
        APP_DIR  = "/home/ubuntu/Skillsync"
        IMAGE    = "yashwagh30/skillsync:latest"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/yashwagh30/Skillsyncs.git'
            }
        }

        stage('Prepare Application on EC2') {
            steps {
                withCredentials([
                    string(credentialsId: 'MONGO_URL', variable: 'MONGO_URL'),
                    string(credentialsId: 'JWT_SECRET', variable: 'JWT_SECRET'),
                    string(credentialsId: 'GOOGLE_CLIENT_ID', variable: 'GOOGLE_CLIENT_ID'),
                    string(credentialsId: 'GOOGLE_CLIENT_SECRET', variable: 'GOOGLE_CLIENT_SECRET')
                ]) {

                    bat """
                    ssh -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% ^
                    "set -e && ^
                     mkdir -p %APP_DIR% && ^
                     cd %APP_DIR% && ^
                     if [ ! -d .git ]; then ^
                       git clone https://github.com/yashwagh30/Skillsyncs.git .; ^
                     else ^
                       git pull origin main; ^
                     fi && ^
                     cat <<EOF > .env ^
MONGO_URL=%MONGO_URL% ^
JWT_SECRET=%JWT_SECRET% ^
GOOGLE_CLIENT_ID=%GOOGLE_CLIENT_ID% ^
GOOGLE_CLIENT_SECRET=%GOOGLE_CLIENT_SECRET% ^
NODE_ENV=production ^
PORT=5008 ^
EOF"
                    """
                }
            }
        }

        stage('Build Docker Image (on EC2)') {
            steps {
                bat """
                ssh -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% ^
                "cd %APP_DIR% && docker build -t %IMAGE% ."
                """
            }
        }

        stage('Deploy Docker Container (on EC2)') {
            steps {
                bat """
                ssh -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% ^
                "docker stop skillsync || true && ^
                 docker rm skillsync || true && ^
                 docker run -d ^
                   --name skillsync ^
                   --restart unless-stopped ^
                   --env-file %APP_DIR%/.env ^
                   -p 80:5008 ^
                   %IMAGE%"
                """
            }
        }
    }

    post {
        success {
            echo "✅ SkillSync deployed successfully"
        }
        failure {
            echo "❌ SkillSync pipeline failed"
        }
    }
}
