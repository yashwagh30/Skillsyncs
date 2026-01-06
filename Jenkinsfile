pipeline {
    agent any

    environment {
        IMAGE_NAME = "yashwagh30/skillsync"
        IMAGE_TAG  = "latest"
        EC2_USER   = "ubuntu"
        EC2_HOST   = "<EC2_PUBLIC_IP>"   // <-- replace this
        APP_PORT   = "5008"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/yashwagh30/Skillsyncs.git'
            }
        }

        stage('Create .env file (from Jenkins Secrets)') {
            steps {
                withCredentials([
                    string(credentialsId: 'MONGO_URL', variable: 'MONGO_URL'),
                    string(credentialsId: 'JWT_SECRET', variable: 'JWT_SECRET'),
                    string(credentialsId: 'GOOGLE_CLIENT_ID', variable: 'GOOGLE_CLIENT_ID'),
                    string(credentialsId: 'GOOGLE_CLIENT_SECRET', variable: 'GOOGLE_CLIENT_SECRET')
                ]) {
                    sh '''
                    cat <<EOF > .env
MONGO_URL=$MONGO_URL
JWT_SECRET=$JWT_SECRET
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
NODE_ENV=production
PORT=5008
EOF
                    '''
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t $IMAGE_NAME:$IMAGE_TAG .'
            }
        }

        stage('Push Image to Docker Hub') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh '''
                    echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                    docker push $IMAGE_NAME:$IMAGE_TAG
                    '''
                }
            }
        }

        stage('Deploy on EC2 via SSH') {
            steps {
                sshagent(credentials: ['ec2-ssh']) {
                    sh '''
                    ssh -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST << EOF
                      docker pull $IMAGE_NAME:$IMAGE_TAG
                      docker stop skillsync || true
                      docker rm skillsync || true

                      cat <<ENVEOF > /home/ubuntu/.env
MONGO_URL=$MONGO_URL
JWT_SECRET=$JWT_SECRET
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
NODE_ENV=production
PORT=5008
ENVEOF

                      docker run -d \
                        --name skillsync \
                        --env-file /home/ubuntu/.env \
                        -p 80:5008 \
                        $IMAGE_NAME:$IMAGE_TAG
                    EOF
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "✅ SkillSync deployed successfully on EC2"
        }
        failure {
            echo "❌ Deployment failed"
        }
    }
}
