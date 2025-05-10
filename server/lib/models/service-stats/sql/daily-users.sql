SELECT
	EXTRACT(YEAR FROM "createdAt") || '-' || lpad(EXTRACT(MONTH FROM "createdAt")::text, 2, '0') || '-' || lpad(EXTRACT(DAY FROM "createdAt")::text, 2, '0') AS "date",
	COUNT(DISTINCT "agentId") AS "activeUsers"
FROM public."AuditEvent"
GROUP BY "date"
;
