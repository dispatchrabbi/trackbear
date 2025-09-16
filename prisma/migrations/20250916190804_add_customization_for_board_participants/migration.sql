-- AlterTable
ALTER TABLE "BoardParticipant" ADD COLUMN     "color" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "displayName" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "Board_uuid_idx" ON "Board"("uuid");
