-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "goal" INTEGER,
    "startDate" TEXT,
    "endDate" TEXT,
    "visibility" TEXT NOT NULL,
    "starred" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("createdAt", "endDate", "goal", "id", "ownerId", "starred", "startDate", "state", "title", "type", "updatedAt", "uuid", "visibility") SELECT "createdAt", "endDate", "goal", "id", "ownerId", "starred", "startDate", "state", "title", "type", "updatedAt", "uuid", "visibility" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_uuid_key" ON "Project"("uuid");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
