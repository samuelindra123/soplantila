-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "processing_error" TEXT,
ADD COLUMN     "processing_status" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "status" "PostStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateIndex
CREATE INDEX "posts_status_processing_status_idx" ON "posts"("status", "processing_status");
