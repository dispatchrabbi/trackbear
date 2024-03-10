-- CreateTable
CREATE TABLE "Goal" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GoalToWork" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_GoalToTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Goal_uuid_key" ON "Goal"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "_GoalToWork_AB_unique" ON "_GoalToWork"("A", "B");

-- CreateIndex
CREATE INDEX "_GoalToWork_B_index" ON "_GoalToWork"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_GoalToTag_AB_unique" ON "_GoalToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_GoalToTag_B_index" ON "_GoalToTag"("B");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GoalToWork" ADD CONSTRAINT "_GoalToWork_A_fkey" FOREIGN KEY ("A") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GoalToWork" ADD CONSTRAINT "_GoalToWork_B_fkey" FOREIGN KEY ("B") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GoalToTag" ADD CONSTRAINT "_GoalToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GoalToTag" ADD CONSTRAINT "_GoalToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
