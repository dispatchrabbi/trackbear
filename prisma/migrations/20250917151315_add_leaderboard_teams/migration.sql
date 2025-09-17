-- AlterTable
ALTER TABLE "public"."Board" ADD COLUMN     "enableTeams" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."BoardParticipant" ADD COLUMN     "teamId" INTEGER;

-- CreateTable
CREATE TABLE "public"."BoardTeam" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT '',
    "boardId" INTEGER NOT NULL,

    CONSTRAINT "BoardTeam_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BoardTeam_uuid_key" ON "public"."BoardTeam"("uuid");

-- AddForeignKey
ALTER TABLE "public"."BoardParticipant" ADD CONSTRAINT "BoardParticipant_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."BoardTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BoardTeam" ADD CONSTRAINT "BoardTeam_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "public"."Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
