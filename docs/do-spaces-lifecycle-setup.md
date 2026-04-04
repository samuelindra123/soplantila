# DigitalOcean Spaces Temp Cleanup Configuration

## Overview

This document describes how to set up automatic cleanup for temporary upload files in DigitalOcean Spaces.

## Problem

When users start uploading files but don't complete the process (e.g., they close the browser), temporary files are left in the `temp/` folder. These files need to be cleaned up automatically.

## Solution: Lifecycle Rules

DigitalOcean Spaces supports lifecycle rules that can automatically delete objects after a specified number of days.

### Setting Up via DigitalOcean Console

1. Log in to [DigitalOcean Control Panel](https://cloud.digitalocean.com/)
2. Navigate to **Spaces** → Select your bucket (`soplantila`)
3. Click on **Settings** tab
4. Scroll to **Lifecycle Rules** section
5. Click **Add Rule**
6. Configure as follows:
   - **Prefix**: `temp/`
   - **Delete objects after**: `1` day(s)
7. Click **Save**

### Setting Up via s3cmd (CLI)

First, install and configure s3cmd:

```bash
# Install s3cmd
pip install s3cmd

# Configure (or create ~/.s3cfg manually)
s3cmd --configure
```

Create a lifecycle policy file (`lifecycle.xml`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LifecycleConfiguration>
  <Rule>
    <ID>cleanup-temp-uploads</ID>
    <Filter>
      <Prefix>temp/</Prefix>
    </Filter>
    <Status>Enabled</Status>
    <Expiration>
      <Days>1</Days>
    </Expiration>
  </Rule>
</LifecycleConfiguration>
```

Apply the lifecycle rule:

```bash
s3cmd setlifecycle lifecycle.xml s3://soplantila
```

### Setting Up via AWS CLI

Configure AWS CLI with DigitalOcean Spaces credentials:

```bash
aws configure --profile digitalocean
# Access Key ID: DO801ZBT96RAZY9XGBZ3
# Secret Access Key: (your secret)
# Default region: sfo3
# Default output format: json
```

Create the lifecycle configuration:

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket soplantila \
  --endpoint-url https://sfo3.digitaloceanspaces.com \
  --profile digitalocean \
  --lifecycle-configuration '{
    "Rules": [
      {
        "ID": "cleanup-temp-uploads",
        "Status": "Enabled",
        "Filter": {
          "Prefix": "temp/"
        },
        "Expiration": {
          "Days": 1
        }
      }
    ]
  }'
```

## Verification

To verify the lifecycle rule is active:

```bash
# Via AWS CLI
aws s3api get-bucket-lifecycle-configuration \
  --bucket soplantila \
  --endpoint-url https://sfo3.digitaloceanspaces.com \
  --profile digitalocean
```

Or check via the DigitalOcean Console in the **Settings** → **Lifecycle Rules** section.

## Backend Fallback Cleanup

In addition to the lifecycle rule, the backend also has a scheduled cleanup task that:

1. Queries the `temp_uploads` table for expired records
2. Deletes the corresponding files from Spaces
3. Removes the database records

This provides double protection in case the lifecycle rule doesn't run immediately.

## File Structure

```
soplantila/
├── temp/                  # Temporary uploads (auto-deleted after 24h)
│   └── {userId}/
│       └── {uuid}_{filename}
├── posts/
│   ├── images/            # Permanent post images
│   │   └── {userId}/
│   │       └── {YYYY/MM}/
│   │           └── {uuid}.{ext}
│   └── videos/            # Permanent post videos
│       └── {userId}/
│           └── {YYYY/MM}/
│               └── {uuid}.{ext}
└── profile-images/        # User profile images
    └── {userId}/
        └── {uuid}.{ext}
```

## Environment Variables

```env
DO_SPACES_REGION=sfo3
DO_SPACES_BUCKET=soplantila
DO_SPACES_ENDPOINT=https://sfo3.digitaloceanspaces.com
DO_SPACES_CDN_URL=https://soplantila.sfo3.cdn.digitaloceanspaces.com
DO_SPACES_KEY=your_access_key
DO_SPACES_SECRET=your_secret_key
DO_SPACES_ACL=public-read
```
