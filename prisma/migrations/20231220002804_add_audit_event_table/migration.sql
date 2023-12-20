-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "agentId" INTEGER NOT NULL,
    "patientId" INTEGER,
    "goalId" INTEGER,
    "eventType" TEXT NOT NULL,
    "auxInfo" TEXT NOT NULL
);
