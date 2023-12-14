-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Update" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Update_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Update" ("createdAt", "date", "id", "projectId", "updatedAt", "value") SELECT "createdAt", "date", "id", "projectId", "updatedAt", "value" FROM "Update";
DROP TABLE "Update";
ALTER TABLE "new_Update" RENAME TO "Update";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
