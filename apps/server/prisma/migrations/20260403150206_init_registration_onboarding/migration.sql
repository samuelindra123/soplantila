-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING_VERIFICATION', 'EMAIL_VERIFIED', 'ONBOARDING_IN_PROGRESS', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('EMAIL_VERIFICATION');

-- CreateEnum
CREATE TYPE "OtpStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'FAILED', 'SUPERSEDED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "email_verified_at" TIMESTAMP(3),
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_otps" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resend_count" INTEGER NOT NULL DEFAULT 0,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "verified_at" TIMESTAMP(3),
    "status" "OtpStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "username" VARCHAR(30) NOT NULL,
    "tanggal_lahir" TIMESTAMP(3) NOT NULL,
    "tempat_lahir" VARCHAR(120) NOT NULL,
    "gender" "Gender" NOT NULL,
    "pekerjaan" VARCHAR(120),
    "foto_profil_url" VARCHAR(500),
    "bio" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "email_otps_user_id_purpose_status_idx" ON "email_otps"("user_id", "purpose", "status");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_profiles_user_id_key" ON "onboarding_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_profiles_username_key" ON "onboarding_profiles"("username");

-- AddForeignKey
ALTER TABLE "email_otps" ADD CONSTRAINT "email_otps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_profiles" ADD CONSTRAINT "onboarding_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
