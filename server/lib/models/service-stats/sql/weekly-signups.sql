SELECT
	EXTRACT(YEAR FROM "createdAt") || '-' || lpad(EXTRACT(WEEK FROM "createdAt")::text, 2, '0') AS "weekNumber",
	COUNT(DISTINCT "agentId") AS "signups"
FROM public."AuditEvent"
WHERE "eventType" = 'user:signup'
GROUP BY "weekNumber"
;
