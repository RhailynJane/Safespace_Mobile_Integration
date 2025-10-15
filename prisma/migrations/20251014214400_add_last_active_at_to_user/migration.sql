/*
  Warnings:

  - You are about to drop the column `timezone` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "timezone",
ADD COLUMN     "last_active_at" TIMESTAMP(3);
