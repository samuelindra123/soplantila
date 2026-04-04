-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "post_media" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "media_type" "MediaType" NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "public_url" VARCHAR(500) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "original_name" VARCHAR(255),
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temp_uploads" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "temp_key" VARCHAR(500) NOT NULL,
    "media_type" "MediaType" NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "original_name" VARCHAR(255),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temp_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "post_media_post_id_idx" ON "post_media"("post_id");

-- CreateIndex
CREATE UNIQUE INDEX "temp_uploads_temp_key_key" ON "temp_uploads"("temp_key");

-- CreateIndex
CREATE INDEX "temp_uploads_user_id_expires_at_idx" ON "temp_uploads"("user_id", "expires_at");

-- CreateIndex for feed query optimization
CREATE INDEX "posts_created_at_idx" ON "posts"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temp_uploads" ADD CONSTRAINT "temp_uploads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
