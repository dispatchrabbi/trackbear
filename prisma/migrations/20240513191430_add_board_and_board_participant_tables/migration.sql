-- CreateTable
CREATE TABLE "Board" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" TEXT,
    "endDate" TEXT,
    "goal" JSONB NOT NULL,
    "starred" BOOLEAN NOT NULL DEFAULT false,
    "isJoinable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardParticipant" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "boardId" INTEGER NOT NULL,

    CONSTRAINT "BoardParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BoardParticipantToWork" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_BoardParticipantToTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Board_uuid_key" ON "Board"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "BoardParticipant_uuid_key" ON "BoardParticipant"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "BoardParticipant_userId_key" ON "BoardParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "_BoardParticipantToWork_AB_unique" ON "_BoardParticipantToWork"("A", "B");

-- CreateIndex
CREATE INDEX "_BoardParticipantToWork_B_index" ON "_BoardParticipantToWork"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_BoardParticipantToTag_AB_unique" ON "_BoardParticipantToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_BoardParticipantToTag_B_index" ON "_BoardParticipantToTag"("B");

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardParticipant" ADD CONSTRAINT "BoardParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardParticipant" ADD CONSTRAINT "BoardParticipant_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BoardParticipantToWork" ADD CONSTRAINT "_BoardParticipantToWork_A_fkey" FOREIGN KEY ("A") REFERENCES "BoardParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BoardParticipantToWork" ADD CONSTRAINT "_BoardParticipantToWork_B_fkey" FOREIGN KEY ("B") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BoardParticipantToTag" ADD CONSTRAINT "_BoardParticipantToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "BoardParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BoardParticipantToTag" ADD CONSTRAINT "_BoardParticipantToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
