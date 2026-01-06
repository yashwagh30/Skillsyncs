pipeline {
    agent any

    environment {
        EC2_HOST = "43.205.254.44"
        APP_DIR  = "/home/ubuntu/Skillsync"
        IMAGE    = "yashwagh30/skillsync:latest"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git url: 'https://github.com/yashwagh30/Skillsyncs.git', branch: 'main'
            }
        }

        stage('Deploy to EC2') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'ec2-ssh',
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    ),
                    string(credentialsId: 'MONGO_URL', variable: 'MONGO_URL'),
                    string(credentialsId: 'JWT_SECRET', variable: 'JWT_SECRET'),
                    string(credentialsId: 'GOOGLE_CLIENT_ID', variable: 'GOOGLE_CLIENT_ID'),
                    string(credentialsId: 'GOOGLE_CLIENT_SECRET', variable: 'GOOGLE_CLIENT_SECRET')
                ]) {

                    bat """
                    ssh -i "%SSH_KEY%" -o StrictHostKeyChecking=no %SSH_USER%@%EC2_HOST% ^
                    "set -e && ^
                     mkdir -p %APP_DIR% && ^
                     cd %APP_DIR% && ^
                     if [ ! -d .git ]; then ^
                       git clone https://github.com/yashwagh30/Skillsyncs.git .; ^
                     else ^
                       git pull origin main; ^
                     fi && ^
                     echo MONGO_URL=%MONGO_URL% > .env && ^
                     echo JWT_SECRET=%JWT_SECRET% >> .env && ^
                     echo GOOGLE_CLIENT_ID=%GOOGLE_CLIENT_ID% >> .env && ^
                     echo GOOGLE_CLIENT_SECRET=%GOOGLE_CLIENT_SECRET% >> .env && ^
                     echo NODE_ENV=production >> .env && ^
                     echo PORT=5008 >> .env && ^
                     docker stop skillsync || true && ^
                     docker rm skillsync || true && ^
                     docker build -t %IMAGE% . && ^
                     docker run -d --name skillsync --env-file .env -p 80:5008 %IMAGE%"
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ SkillSync deployed successfully on EC2"
        }
        failure {
            echo "❌ SkillSync deployment failed"
        }
    }
}
