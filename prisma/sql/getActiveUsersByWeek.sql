SELECT
	EXTRACT(ISOYEAR FROM "createdAt") || '-' || lpad(EXTRACT(WEEK FROM "createdAt")::text, 2, '0') AS "weekNumber",
	COUNT(DISTINCT "agentId") AS "activeUsers"
FROM public."AuditEvent"
WHERE "eventType" = 'user:login'
GROUP BY "weekNumber"
;
