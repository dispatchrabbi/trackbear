# TODO

These are in no particular order. Which isn't to say they _aren't_ in any order. But it would be wise not to read too far into the order they _are_ in.

## Admin
- [ ] Allow admins to rename user/displayName
- [ ] Allow admins to force password reset
- [ ] Improve audit event retrieval/listings
- [ ] Improve user management
- [ ] Manage projects, goals, leaderboards
- [ ] Allow admins to view any project, goal, leaderboard in-situ
- [ ] Revamp stats on the Users page

## Back-End
- [ ] Sharp-ify covers and avatar files to save on space
- [ ] Implement data export
- [ ] Convert the API to consistently use PATCH
- [ ] Build out a full model layer so it can be used by scripts/workers/queues as well as endpoints
- [ ] Make rate-limiting better
- [ ] Lock-out multiple wrong sign-in attempts
- [ ] Add optional TOTP setup
- [ ] Double-check [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [ ] Fix winston warnings by creating a non-default logger to use and exporting that (which can be silenced during unit tests)

## Charts
- [ ] Fix the leaderboard tooltips
- [ ] Graph widget overhaul: lines/bars toggle, full-screen, download
- [ ] Rewrite the heatmap to use Plot

## Dashboard
- [ ] Dashboard could be more fun/welcoming/helpful
- [ ] Show starred leaderboards on dashboard

## Developers
- [ ] Implement API keys
- [ ] Create Swagger/OpenAPI docs + other developer docs

## Goals
- [ ] Revamp goal details pages (and goal list page) to better handle achieved and ended goals (h/t Liv)
- [ ] Habit progress gauges need a UI revamp
- [ ] Target goal details pages should be nicer/more informative
- [ ] Goal pages could be more fun
- [ ] Multiple goal points (a la "stretch goals")
- [ ] Split targets and habits #maybe

## Help
- [ ] Goals
- [ ] Leaderboards
- [ ] Settings
- [ ] Tags
- [ ] ...anything else I missed

## Leaderboards
- [ ] Separate join code from UUID and allow rolling the code
- [ ] Give board owners much more control over participants (change goals, remove/ban)
- [ ] Allow more than one board owner
- [ ] Group participants into teams and compare team totals (h/t Asha)
- [ ] Make sure each participant has their own, consistent color and marker across the graph and the progress bar (h/t Arden)
- [ ] Allow viewing leaderboards without logging in
- [ ] Cyclical leaderboards (renews or does new standings every week/month/yearh) (h/t Becca Stargazer)

## Observability
- [ ] Create ping check
- [ ] Ship logs somewhere (Greylog? Uptrace?)
- [ ] Ship metrics/telemetry somewhere (Uptrace? Jaeger?)

## Projects
- [ ] The project details page should show more info about the project/look nicer
- [ ] Implement project tags (h/t someone from ko-fi go look it up)

## Public
- [ ] Project progress embed (h/t Laura)
- [ ] Grand Totals embed (h/t Laura)
- [ ] Progress update widget (h/t Laura)

## Stats
- [ ] Totals by tag
- [ ] Totals by year (h/t Deerna)
- [ ] Graph lifetime progress
- [ ] Ability to exempt tags/projects from total #maybe

## Tags
- [ ] Improve tag inputs

## Tallies
- [ ] Make the tally table more mobile-friendly (h/t lailah)
- [ ] Default the Enter Progress dialog on a project page to the last measure entered
- [ ] Allow logging half-pages (but only for pages probably) (h/t Alex) #maybe
- [ ] Consider the ability to add more than one type of progress at once (h/t Alice) #maybe

## Themes
- [ ] Make a strategy for actual color systems: changelog, project phase, goal type, tag color, streak length
- [ ] Need to figure out accent vs success vs completion
- [ ] Should convert text-white to text-surface-0 probably
- [ ] Definitely need to figure out themed chart colors somehow
- [ ] Investigate 'progress-spinner-circle' (might need to look at colors on /progressspinner)

## Branding
- [ ] Create/commission logo and assets
- [ ] Improve home page

## Tech Debt/Code Quality
- [ ] Increase code coverage
- [ ] Fix the required-auth page architecture
- [ ] Improve the worker architecture
- [ ] Improve the queue architecture
- [ ] Figure out how to make 'server/*' work on back end imports
- [ ] Do a better job with shared data/functions
- [ ] De-duplicate add/edit forms
- [ ] Create better seed data for testing
- [ ] Use 'omit' in prisma schema to protect password and other secret fields
- [ ] Update date-fns to 4.0
- [ ] Simplify createDateRanges when date-fns hits 4.0

## Deployment
- [ ] Create staging instance
- [ ] Better diagnostics on deploy if something isn't right
- [ ] Implement remote deploys
- [ ] Zero- or minimal-downtime deploys
- [ ] Investigate Docker Swarm

## Wishlist
- [ ] Pull data from prod back to local for reproducing bugs
- [ ] Publish usage metrics
