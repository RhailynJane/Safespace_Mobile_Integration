/*
  Warnings:

  - The `assessment_type` column on the `assessments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `legal_status` column on the `clients` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `conversation_type` on the `conversations` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `journal_entries` table. All the data in the column will be lost.
  - You are about to drop the column `emoji` on the `journal_entries` table. All the data in the column will be lost.
  - You are about to drop the column `emotion_type` on the `journal_entries` table. All the data in the column will be lost.
  - You are about to drop the column `template_id` on the `journal_entries` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `journal_entries` table. All the data in the column will be lost.
  - The `role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `journal_tags` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `journal_templates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mood_factors` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[conversation_id]` on the table `conversations` will be added. If there are existing duplicate values, this will fail.
  - The required column `conversation_id` was added to the `conversations` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `emotion` to the `journal_entries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entry_text` to the `journal_entries` table without a default value. This is not possible if the table is not empty.
  - Made the column `message_type` on table `messages` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `mood_type` on the `mood_entries` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `resources` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'team_leader', 'support_worker', 'client', 'family_member');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'suspended', 'pending');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('agender', 'gender_fluid', 'genderqueer', 'gender_variant', 'intersex', 'man', 'non_binary', 'non_conforming', 'questioning', 'transgender_man', 'transgender_woman', 'two_spirit', 'dont_identify_with_any_gender', 'do_not_know', 'prefer_not_to_answer', 'woman');

-- CreateEnum
CREATE TYPE "CanadaStatus" AS ENUM ('canadian_citizen', 'permanent_resident', 'refugee', 'newcomer', 'temporary_resident', 'do_not_know', 'prefer_not_to_answer', 'other');

-- CreateEnum
CREATE TYPE "EthnoculturalBackground" AS ENUM ('first_nations', 'metis', 'inuit', 'european', 'asian', 'south_asian', 'southeast_asian', 'african', 'caribbean', 'latin_american', 'middle_eastern', 'mixed_heritage', 'prefer_not_to_answer', 'other');

-- CreateEnum
CREATE TYPE "PrimaryLanguage" AS ENUM ('english', 'french', 'spanish', 'mandarin', 'cantonese', 'punjabi', 'tagalog', 'arabic', 'german', 'italian', 'portuguese', 'russian', 'japanese', 'korean', 'hindi', 'vietnamese', 'other');

-- CreateEnum
CREATE TYPE "MentalHealthConcerns" AS ENUM ('have_disability', 'have_illness_or_mental_health_concern', 'no_ongoing_medical_conditions', 'do_not_know', 'not_applicable', 'prefer_not_to_answer');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('pre_survey', 'post_survey', 'periodic_check');

-- CreateEnum
CREATE TYPE "MoodType" AS ENUM ('very_happy', 'happy', 'neutral', 'sad', 'very_sad');

-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('direct', 'group');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'image', 'file', 'system');

-- CreateEnum
CREATE TYPE "EmotionType" AS ENUM ('very_sad', 'sad', 'neutral', 'happy', 'very_happy');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('Affirmation', 'Quote', 'Article', 'Exercise', 'Guide');

-- CreateEnum
CREATE TYPE "LegalStatus" AS ENUM ('independent', 'guardianship', 'co_decision_making');

-- DropForeignKey
ALTER TABLE "public"."journal_entries" DROP CONSTRAINT "journal_entries_template_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."journal_tags" DROP CONSTRAINT "journal_tags_journal_entry_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."messages" DROP CONSTRAINT "messages_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."messages" DROP CONSTRAINT "messages_sender_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."mood_factors" DROP CONSTRAINT "mood_factors_mood_entry_id_fkey";

-- AlterTable
ALTER TABLE "assessments" DROP COLUMN "assessment_type",
ADD COLUMN     "assessment_type" "AssessmentType" NOT NULL DEFAULT 'pre_survey';

-- AlterTable
ALTER TABLE "client_profiles" ADD COLUMN     "canada_status" "CanadaStatus",
ADD COLUMN     "date_came_to_canada" TIMESTAMP(3),
ADD COLUMN     "ethnocultural_background" "EthnoculturalBackground",
ADD COLUMN     "is_lgbtq" TEXT,
ADD COLUMN     "mental_health_concerns" "MentalHealthConcerns",
ADD COLUMN     "primary_language" "PrimaryLanguage",
ADD COLUMN     "pronouns" TEXT,
ADD COLUMN     "support_needed" TEXT;

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "legal_status",
ADD COLUMN     "legal_status" "LegalStatus";

-- AlterTable
ALTER TABLE "conversations" DROP COLUMN "conversation_type",
ADD COLUMN     "conversation_id" TEXT NOT NULL,
ADD COLUMN     "is_active" BOOLEAN DEFAULT true,
ADD COLUMN     "last_message_at" TIMESTAMP(3),
ADD COLUMN     "type" "ConversationType" NOT NULL DEFAULT 'direct';

-- AlterTable
ALTER TABLE "journal_entries" DROP COLUMN "content",
DROP COLUMN "emoji",
DROP COLUMN "emotion_type",
DROP COLUMN "template_id",
DROP COLUMN "title",
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "emotion" "EmotionType" NOT NULL,
ADD COLUMN     "entry_text" TEXT NOT NULL,
ADD COLUMN     "entry_title" TEXT,
ADD COLUMN     "tags" TEXT[];

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "attachment_url" TEXT,
ADD COLUMN     "file_name" TEXT,
ADD COLUMN     "file_size" INTEGER,
ALTER COLUMN "message_type" SET NOT NULL;

-- AlterTable
ALTER TABLE "mood_entries" DROP COLUMN "mood_type",
ADD COLUMN     "mood_type" "MoodType" NOT NULL;

-- AlterTable
ALTER TABLE "resources" DROP COLUMN "type",
ADD COLUMN     "type" "ResourceType" NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "canada_status" "CanadaStatus",
ADD COLUMN     "date_came_to_canada" TIMESTAMP(3),
ADD COLUMN     "ethnocultural_background" "EthnoculturalBackground",
ADD COLUMN     "is_lgbtq" TEXT,
ADD COLUMN     "mental_health_concerns" "MentalHealthConcerns",
ADD COLUMN     "primary_language" "PrimaryLanguage",
ADD COLUMN     "pronouns" TEXT,
ADD COLUMN     "support_needed" TEXT,
ADD COLUMN     "timezone" TEXT DEFAULT 'America/Edmonton',
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'client',
DROP COLUMN "status",
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'active';

-- DropTable
DROP TABLE "public"."journal_tags";

-- DropTable
DROP TABLE "public"."journal_templates";

-- DropTable
DROP TABLE "public"."mood_factors";

-- CreateTable
CREATE TABLE "file_uploads" (
    "id" SERIAL NOT NULL,
    "message_id" INTEGER NOT NULL,
    "original_name" TEXT NOT NULL,
    "stored_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT,
    "upload_status" TEXT NOT NULL DEFAULT 'completed',
    "uploaded_by" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "file_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_workers" (
    "id" SERIAL NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(20),
    "specialization" TEXT,
    "bio" TEXT,
    "years_of_experience" INTEGER,
    "avatar_url" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "availability" JSONB,
    "hourly_rate" DECIMAL(10,2),
    "languages_spoken" TEXT[],
    "certifications" TEXT[],
    "education" TEXT,
    "license_number" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_workers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "support_workers_email_key" ON "support_workers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_conversation_id_key" ON "conversations"("conversation_id");

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_assigned_worker_id_fkey" FOREIGN KEY ("assigned_worker_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
