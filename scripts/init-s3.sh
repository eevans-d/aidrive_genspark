#!/bin/bash
# Initialize S3 bucket for staging environment
# This script runs automatically when LocalStack container starts

set -e

echo "Initializing S3 for staging environment..."

# Wait for LocalStack to be ready
echo "Waiting for LocalStack S3 service to be ready..."
until awslocal s3 ls > /dev/null 2>&1; do
  echo "LocalStack not ready yet, waiting..."
  sleep 2
done

echo "✓ LocalStack is ready"

# Create staging bucket
BUCKET_NAME="inventario-retail-bucket-staging"
echo "Creating S3 bucket: $BUCKET_NAME"

# Check if bucket exists
if awslocal s3 ls "s3://$BUCKET_NAME" 2>/dev/null; then
  echo "✓ Bucket $BUCKET_NAME already exists"
else
  echo "Creating new bucket $BUCKET_NAME"
  awslocal s3 mb "s3://$BUCKET_NAME"
  echo "✓ Bucket $BUCKET_NAME created"
fi

# Enable versioning
echo "Enabling versioning for $BUCKET_NAME"
awslocal s3api put-bucket-versioning \
  --bucket "$BUCKET_NAME" \
  --versioning-configuration Status=Enabled
echo "✓ Versioning enabled"

# Configure CORS
echo "Configuring CORS for $BUCKET_NAME"
CORS_CONFIG='{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": ["http://localhost:8080", "http://localhost:3001", "http://localhost:9091"],
      "ExposeHeaders": ["ETag", "x-amz-version-id"],
      "MaxAgeSeconds": 3000
    }
  ]
}'

awslocal s3api put-bucket-cors \
  --bucket "$BUCKET_NAME" \
  --cors-configuration "$CORS_CONFIG"
echo "✓ CORS configured"

# Configure lifecycle policy (delete old versions after 30 days)
echo "Configuring lifecycle policy for $BUCKET_NAME"
LIFECYCLE_CONFIG='{
  "Rules": [
    {
      "Id": "DeleteOldVersions",
      "Status": "Enabled",
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 30
      }
    },
    {
      "Id": "DeleteIncompleteMultipartUploads",
      "Status": "Enabled",
      "AbortIncompleteMultipartUpload": {
        "DaysAfterInitiation": 1
      }
    }
  ]
}'

awslocal s3api put-bucket-lifecycle-configuration \
  --bucket "$BUCKET_NAME" \
  --lifecycle-configuration "$LIFECYCLE_CONFIG"
echo "✓ Lifecycle policy configured"

# Create test directories structure
echo "Creating test directories in $BUCKET_NAME"
mkdir -p /tmp/s3-setup

# Create some test files
echo "Test inventory data" > /tmp/s3-setup/test_inventory.txt
echo "Test user data" > /tmp/s3-setup/test_users.json
echo "Test transaction data" > /tmp/s3-setup/test_transactions.csv

# Upload test files
awslocal s3 cp /tmp/s3-setup/test_inventory.txt "s3://$BUCKET_NAME/data/test_inventory.txt"
awslocal s3 cp /tmp/s3-setup/test_users.json "s3://$BUCKET_NAME/data/test_users.json"
awslocal s3 cp /tmp/s3-setup/test_transactions.csv "s3://$BUCKET_NAME/data/test_transactions.csv"
echo "✓ Test files uploaded"

# List bucket contents
echo ""
echo "📦 S3 Bucket Contents:"
awslocal s3 ls "s3://$BUCKET_NAME" --recursive

# Get bucket info
echo ""
echo "📊 Bucket Configuration:"
echo "Name: $BUCKET_NAME"
echo "Versioning: $(awslocal s3api get-bucket-versioning --bucket "$BUCKET_NAME" --query 'Status' --output text)"
echo "Objects: $(awslocal s3 ls "s3://$BUCKET_NAME" --recursive --summarize --query 'Summary.Total' | tail -1)"

echo ""
echo "✅ S3 initialization complete!"
