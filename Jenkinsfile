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

        stage('Deploy on EC2') {
            steps {
                sshagent(['ec2-ssh']) {
                    sh """
                    ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} << 'EOF'
                        set -e

                        # Clone or update repo
                        if [ ! -d "${APP_DIR}" ]; then
                          git clone https://github.com/yashwagh30/Skillsyncs.git ${APP_DIR}
                        fi
                        cd ${APP_DIR}
                        git pull origin main

                        # Create .env from injected secrets
                        cat <<EOT > .env
MONGO_URL=${MONGO_URL}
JWT_SECRET=${JWT_SECRET}
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
NODE_ENV=production
PORT=5008
EOT

                        # Build and run container
                        docker build -t ${IMAGE} .
                        docker stop skillsync || true
                        docker rm skillsync || true
                        docker run -d \
                          --name skillsync \
                          --env-file .env \
                          -p 80:5008 \
                          ${IMAGE}
                    EOF
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ SkillSync deployed successfully"
        }
        failure {
            echo "❌ Deployment failed"
        }
    }
}
