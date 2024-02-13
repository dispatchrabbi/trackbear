-- CreateTable
CREATE TABLE "Leaderboard" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "goal" INTEGER,
    "startDate" TEXT,
    "endDate" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Leaderboard_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_LeaderboardToProject" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_LeaderboardToProject_A_fkey" FOREIGN KEY ("A") REFERENCES "Leaderboard" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_LeaderboardToProject_B_fkey" FOREIGN KEY ("B") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Leaderboard_uuid_key" ON "Leaderboard"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "_LeaderboardToProject_AB_unique" ON "_LeaderboardToProject"("A", "B");

-- CreateIndex
CREATE INDEX "_LeaderboardToProject_B_index" ON "_LeaderboardToProject"("B");
