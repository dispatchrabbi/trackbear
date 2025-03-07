WITH targets AS (
	SELECT DISTINCT
		g.id AS "goalId", g.title,
		(g.parameters #> '{threshold,count}')::int AS "count", g.parameters #>> '{threshold,measure}' AS "measure",
		g."startDate", g."endDate",
		array_remove(array_agg(gtw."B"), NULL) AS "workIds",
		array_remove(array_agg(gtb."B"), NULL) AS "tagIds"
	FROM
		"Goal" AS g
		LEFT JOIN "_GoalToWork" AS gtw ON g.id = gtw."A"
			LEFT JOIN "Work" AS w ON gtw."B" = w.id
		LEFT JOIN "_GoalToTag" AS gtb ON g.id = gtb."A"
	WHERE
		g.state = 'active'
		AND g.type = 'target'
		AND g."ownerId" = $1
		AND (w.id IS NULL OR w.state = 'active')
	GROUP BY g.id
	ORDER BY "goalId"
),
tallies AS (
	SELECT
		t.id, t.date, t.measure, t.count, t."workId", t.state,
		array_agg(ttt."A") AS "tagIds"
	FROM
		"Tally" AS t
		LEFT JOIN "_TagToTally" AS ttt ON t.id = ttt."B"
	WHERE
		t.state = 'active'
		AND t."ownerId" = $1
	GROUP BY t.id
	ORDER BY t.id
)
SELECT
	targets."goalId",
	sum(tallies.count)::int AS total
FROM
	targets
	INNER JOIN tallies ON (
		(targets.measure = tallies.measure) AND
		(targets."startDate" IS NULL OR tallies.date >= targets."startDate") AND
		(targets."endDate" IS NULL OR tallies.date <= targets."endDate") AND
		(array_length(targets."workIds", 1) IS NULL OR tallies."workId" = ANY (targets."workIds")) AND
		(array_length(targets."tagIds", 1) IS NULL OR tallies."tagIds" && targets."tagIds")
	)
GROUP BY (
	targets."goalId"
)
ORDER BY "goalId"
;