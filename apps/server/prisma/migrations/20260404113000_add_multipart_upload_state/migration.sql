CREATE TYPE "UploadStrategy" AS ENUM ('SINGLE', 'MULTIPART');

ALTER TABLE "temp_uploads"
ADD COLUMN "upload_strategy" "UploadStrategy" NOT NULL DEFAULT 'SINGLE',
ADD COLUMN "multipart_upload_id" VARCHAR(255);
