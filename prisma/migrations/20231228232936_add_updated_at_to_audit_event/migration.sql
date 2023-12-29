-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AuditEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "agentId" INTEGER NOT NULL,
    "patientId" INTEGER,
    "goalId" INTEGER,
    "eventType" TEXT NOT NULL,
    "auxInfo" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AuditEvent" ("agentId", "auxInfo", "createdAt", "updatedAt", "eventType", "goalId", "id", "patientId") SELECT "agentId", "auxInfo", "createdAt", "createdAt", "eventType", "goalId", "id", "patientId" FROM "AuditEvent";
DROP TABLE "AuditEvent";
ALTER TABLE "new_AuditEvent" RENAME TO "AuditEvent";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
