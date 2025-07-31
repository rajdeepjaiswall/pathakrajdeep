# AWS Deployment Guide - Pathak Bhandar E-Commerce Platform

## Overview

AWS provides enterprise-grade hosting for the Pathak Bhandar e-commerce platform with:
- High availability and scalability
- Global content delivery network
- Managed database services
- Advanced security features
- Professional monitoring and logging
- Cost-effective scaling options

## Architecture Options

### Option A: Serverless Architecture (Recommended)
```
Route 53 → CloudFront → S3 (React) → API Gateway → Lambda Functions → RDS PostgreSQL
```

### Option B: Traditional EC2 Architecture
```
Route 53 → CloudFront → ALB → EC2 Instances → RDS PostgreSQL
```

### Option C: Container Architecture
```
Route 53 → CloudFront → ALB → ECS Fargate → RDS PostgreSQL
```

## Prerequisites

1. **AWS Account**: Create at aws.amazon.com
2. **AWS CLI**: Install and configure
3. **Domain**: Register or transfer to Route 53
4. **SSL Certificate**: Use AWS Certificate Manager

## Option A: Serverless Deployment (Recommended)

### Step 1: Frontend Deployment (S3 + CloudFront)

#### 1.1 Create S3 Bucket for Static Website

```bash
# Create bucket
aws s3 mb s3://pathak-bhandar-frontend --region us-east-1

# Configure for static website hosting
aws s3 website s3://pathak-bhandar-frontend --index-document index.html --error-document index.html

# Set bucket policy
aws s3api put-bucket-policy --bucket pathak-bhandar-frontend --policy file://bucket-policy.json
```

**bucket-policy.json**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::pathak-bhandar-frontend/*"
    }
  ]
}
```

#### 1.2 Build and Upload Frontend

```bash
# Build React application
npm run build

# Upload to S3
aws s3 sync client/dist/ s3://pathak-bhandar-frontend --delete
```

#### 1.3 Create CloudFront Distribution

```json
// cloudfront-config.json
{
  "CallerReference": "pathak-bhandar-cf-2024",
  "Comment": "Pathak Bhandar CloudFront Distribution",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-pathak-bhandar-frontend",
    "ViewerProtocolPolicy": "redirect-to-https",
    "MinTTL": 0,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    }
  },
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-pathak-bhandar-frontend",
        "DomainName": "pathak-bhandar-frontend.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "Enabled": true,
  "PriceClass": "PriceClass_100"
}
```

### Step 2: Backend Deployment (Lambda + API Gateway)

#### 2.1 Prepare Lambda Functions

Create `serverless.yml`:
```yaml
service: pathak-bhandar-api

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    DATABASE_URL: ${env:DATABASE_URL}
    JWT_SECRET: ${env:JWT_SECRET}
    SESSION_SECRET: ${env:SESSION_SECRET}

functions:
  api:
    handler: server/lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
```

#### 2.2 Create Lambda Handler

```javascript
// server/lambda.js
const serverless = require('serverless-http');
const app = require('./index.js');

module.exports.handler = serverless(app);
```

#### 2.3 Deploy with Serverless Framework

```bash
# Install Serverless Framework
npm install -g serverless

# Deploy backend
serverless deploy
```

### Step 3: Database Setup (RDS PostgreSQL)

#### 3.1 Create RDS Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier pathak-bhandar-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username pathakadmin \
  --master-user-password YourSecurePassword123! \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-12345678 \
  --db-subnet-group-name default \
  --backup-retention-period 7 \
  --storage-encrypted
```

#### 3.2 Security Group Configuration

```bash
# Create security group
aws ec2 create-security-group \
  --group-name pathak-bhandar-db-sg \
  --description "Security group for Pathak Bhandar database"

# Allow PostgreSQL access
aws ec2 authorize-security-group-ingress \
  --group-id sg-12345678 \
  --protocol tcp \
  --port 5432 \
  --source-group sg-87654321
```

#### 3.3 Database Migration

```bash
# Export current data
npm run export-database

# Connect to RDS instance
psql -h your-rds-endpoint.amazonaws.com -U pathakadmin -d postgres

# Import schema and data
\i database-schema.sql
\i database-data.sql
```

### Step 4: Domain and SSL Setup

#### 4.1 Route 53 Configuration

```bash
# Create hosted zone
aws route53 create-hosted-zone --name pathakbhandar.in --caller-reference $(date +%s)

# Create A record pointing to CloudFront
aws route53 change-resource-record-sets --hosted-zone-id Z123456789 --change-batch file://dns-records.json
```

#### 4.2 SSL Certificate (ACM)

```bash
# Request certificate
aws acm request-certificate \
  --domain-name pathakbhandar.in \
  --subject-alternative-names www.pathakbhandar.in \
  --validation-method DNS \
  --region us-east-1
```

## Option B: EC2 Deployment

### Step 1: Launch EC2 Instance

```bash
# Launch Ubuntu instance
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --count 1 \
  --instance-type t3.small \
  --key-name your-key-pair \
  --security-group-ids sg-12345678 \
  --subnet-id subnet-12345678
```

### Step 2: Server Setup

```bash
# Connect to instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Install Node.js and dependencies
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs nginx

# Install PM2 for process management
sudo npm install -g pm2

# Clone and setup application
git clone your-repo-url pathak-bhandar
cd pathak-bhandar
npm install
npm run build
```

### Step 3: Nginx Configuration

```nginx
# /etc/nginx/sites-available/pathak-bhandar
server {
    listen 80;
    server_name pathakbhandar.in www.pathakbhandar.in;
    
    # Serve static files
    location / {
        root /home/ubuntu/pathak-bhandar/client/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # API routes
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 4: Start Application

```bash
# Start with PM2
pm2 start server/index.js --name pathak-bhandar-api
pm2 startup
pm2 save

# Enable Nginx
sudo ln -s /etc/nginx/sites-available/pathak-bhandar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Environment Configuration

### Production Environment Variables

```bash
# /home/ubuntu/pathak-bhandar/.env
NODE_ENV=production
DATABASE_URL=postgresql://pathakadmin:password@your-rds-endpoint.amazonaws.com:5432/pathak_bhandar
JWT_SECRET=your-super-secure-jwt-secret-32-chars-minimum
SESSION_SECRET=your-super-secure-session-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://pathakbhandar.in/api/auth/google/callback
```

## Monitoring and Logging

### CloudWatch Setup

```javascript
// Add to your Express app
const winston = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');

const logger = winston.createLogger({
  transports: [
    new WinstonCloudWatch({
      logGroupName: 'pathak-bhandar-logs',
      logStreamName: 'api-logs',
      awsRegion: 'us-east-1'
    })
  ]
});
```

### Application Load Balancer (Optional)

```bash
# Create ALB for high availability
aws elbv2 create-load-balancer \
  --name pathak-bhandar-alb \
  --subnets subnet-12345678 subnet-87654321 \
  --security-groups sg-12345678
```

## Security Best Practices

### 1. Security Groups

```bash
# Web server security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-web \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-web \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

### 2. IAM Roles

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds:DescribeDBInstances",
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3. VPC Configuration

```bash
# Create VPC for isolation
aws ec2 create-vpc --cidr-block 10.0.0.0/16
aws ec2 create-subnet --vpc-id vpc-12345678 --cidr-block 10.0.1.0/24
```

## Backup Strategy

### 1. RDS Automated Backups

```bash
# Enable automated backups
aws rds modify-db-instance \
  --db-instance-identifier pathak-bhandar-db \
  --backup-retention-period 7 \
  --apply-immediately
```

### 2. S3 Versioning

```bash
# Enable versioning for frontend assets
aws s3api put-bucket-versioning \
  --bucket pathak-bhandar-frontend \
  --versioning-configuration Status=Enabled
```

## Cost Optimization

### 1. Reserved Instances

```bash
# Purchase reserved instances for predictable workloads
aws ec2 purchase-reserved-instances-offering \
  --reserved-instances-offering-id ri-12345678 \
  --instance-count 1
```

### 2. Auto Scaling

```yaml
# CloudFormation template for auto scaling
Resources:
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      MinSize: 1
      MaxSize: 5
      DesiredCapacity: 2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
```

## Pricing Estimation

### Serverless Option (Monthly)
- **Lambda**: $5-20 (based on requests)
- **API Gateway**: $3-10 (based on API calls)
- **S3**: $1-5 (storage and bandwidth)
- **CloudFront**: $5-15 (CDN usage)
- **RDS t3.micro**: $15-25
- **Route 53**: $0.50
- **Total**: $30-75/month

### EC2 Option (Monthly)
- **EC2 t3.small**: $15-20
- **RDS t3.micro**: $15-25
- **CloudFront**: $5-15
- **Data Transfer**: $5-10
- **Route 53**: $0.50
- **Total**: $40-70/month

## Deployment Scripts

### Automated Deployment

```bash
#!/bin/bash
# deploy-aws.sh

echo "Starting AWS deployment..."

# Build frontend
npm run build

# Upload to S3
aws s3 sync client/dist/ s3://pathak-bhandar-frontend --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id E123456789 --paths "/*"

# Deploy backend (if using Serverless)
serverless deploy

echo "Deployment completed!"
```

## Maintenance

### Regular Tasks

**Daily**:
- Monitor CloudWatch logs
- Check application health
- Review security alerts

**Weekly**:
- Update dependencies
- Review performance metrics
- Check backup status

**Monthly**:
- Security patches
- Cost optimization review
- Performance tuning

This AWS deployment provides enterprise-level hosting with high availability, scalability, and professional monitoring capabilities for the Pathak Bhandar e-commerce platform.