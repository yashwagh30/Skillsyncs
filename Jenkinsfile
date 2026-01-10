pipeline {
    agent any

    environment {
        IMAGE_NAME = "yashwagh30/skillsync:latest"
        CONTAINER_NAME = "skillsync"
        APP_PORT = "5008"
        HOST_PORT = "8081"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main', url: 'https://github.com/yashwagh30/SkillSync.git'
            }
        }

        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                    '''
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t $IMAGE_NAME .'
            }
        }

        stage('Push Docker Image') {
            steps {
                sh 'docker push $IMAGE_NAME'
            }
        }

        stage('Stop Old Container') {
            steps {
                sh '''
                    docker stop $CONTAINER_NAME || true
                    docker rm $CONTAINER_NAME || true
                '''
            }
        }

        stage('Run New Container') {
            steps {
                withCredentials([
                    string(credentialsId: 'MONGO_URL', variable: 'MONGO_URL'),
                    string(credentialsId: 'JWT_SECRET', variable: 'JWT_SECRET'),
                    string(credentialsId: 'GOOGLE_CLIENT_ID', variable: 'GOOGLE_CLIENT_ID'),
                    string(credentialsId: 'GOOGLE_CLIENT_SECRET', variable: 'GOOGLE_CLIENT_SECRET'),
                    string(credentialsId: 'GOOGLE_CALLBACK_URL', variable: 'GOOGLE_CALLBACK_URL'),
                    string(credentialsId: 'DIGITAL_OCEAN_AGENT_ENDPOINT', variable: 'DIGITAL_OCEAN_AGENT_ENDPOINT'),
                    string(credentialsId: 'DIGITAL_OCEAN_ACCESS_KEY', variable: 'DIGITAL_OCEAN_ACCESS_KEY')
                ]) {
                    sh '''
                        docker run -d \
                          --name $CONTAINER_NAME \
                          -e MONGO_URL=$MONGO_URL \
                          -e JWT_SECRET=$JWT_SECRET \
                          -e GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID \
                          -e GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET \
                          -e GOOGLE_CALLBACK_URL=$GOOGLE_CALLBACK_URL \
                          -e DIGITAL_OCEAN_AGENT_ENDPOINT=$DIGITAL_OCEAN_AGENT_ENDPOINT \
                          -e DIGITAL_OCEAN_ACCESS_KEY=$DIGITAL_OCEAN_ACCESS_KEY \
                          -e NODE_ENV=production \
                          -e PORT=$APP_PORT \
                          -p $HOST_PORT:$APP_PORT \
                          --restart unless-stopped \
                          $IMAGE_NAME
                    '''
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    sleep 10
                    docker ps | grep skillsync
                '''
            }
        }
    }

    post {
        success {
            echo "✅ Deployment successful!"
        }
        failure {
            echo "❌ Deployment failed. Check logs."
        }
    }
}

