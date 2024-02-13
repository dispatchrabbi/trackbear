-- Enable WAL mode to mitigate DB locking
-- See: https://github.com/simonw/til/blob/main/sqlite/enabling-wal-mode.md and https://github.com/prisma/prisma/issues/10403#issuecomment-1500770484

PRAGMA journal_mode=WAL;
