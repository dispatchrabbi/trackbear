/*
  Warnings:

  - A unique constraint covering the columns `[userId,boardId]` on the table `BoardParticipant` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "BoardParticipant" ADD COLUMN     "isOwner" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isParticipant" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "BoardParticipant_userId_boardId_key" ON "BoardParticipant"("userId", "boardId");
