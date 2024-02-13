/*
  Warnings:

  - The primary key for the `Banner` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `id` to the `Banner` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Banner" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "showUntil" DATETIME NOT NULL,
    "message" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'info',
    "icon" TEXT NOT NULL DEFAULT 'campaign',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Banner" ("color", "createdAt", "enabled", "icon", "message", "showUntil", "updatedAt", "uuid") SELECT "color", "createdAt", "enabled", "icon", "message", "showUntil", "updatedAt", "uuid" FROM "Banner";
DROP TABLE "Banner";
ALTER TABLE "new_Banner" RENAME TO "Banner";
CREATE UNIQUE INDEX "Banner_uuid_key" ON "Banner"("uuid");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
