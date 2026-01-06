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
                    ssh -o StrictHostKeyChecking=no -i "%SSH_KEY%" %SSH_USER%@%EC2_HOST% ^
                    "bash -s" < deploy.sh
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
            echo "❌ SkillSync deployment failed"
        }
    }
}
