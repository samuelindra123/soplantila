-- CreateEnum
CREATE TYPE "UploadHistoryStatus" AS ENUM ('PENDING', 'UPLOADING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "MediaUploadStatus" AS ENUM ('PENDING', 'UPLOADING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "upload_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "post_id" TEXT,
    "content" TEXT NOT NULL,
    "status" "UploadHistoryStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "processing_time_ms" INTEGER,
    "total_media_count" INTEGER NOT NULL DEFAULT 0,
    "completed_media_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upload_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_history_media" (
    "id" TEXT NOT NULL,
    "history_id" TEXT NOT NULL,
    "media_type" "MediaType" NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "thumbnail_url" VARCHAR(500),
    "public_url" VARCHAR(500),
    "status" "MediaUploadStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "upload_time_ms" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upload_history_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "upload_history_user_id_created_at_idx" ON "upload_history"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "upload_history_status_idx" ON "upload_history"("status");

-- CreateIndex
CREATE INDEX "upload_history_media_history_id_idx" ON "upload_history_media"("history_id");

-- AddForeignKey
ALTER TABLE "upload_history" ADD CONSTRAINT "upload_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_history_media" ADD CONSTRAINT "upload_history_media_history_id_fkey" FOREIGN KEY ("history_id") REFERENCES "upload_history"("id") ON DELETE CASCADE ON UPDATE CASCADE;
