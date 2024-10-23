# TODO

These are in no particular order. Which isn't to say they _aren't_ in any order. But it would be wise not to read too far into the order they _are_ in.

## Before November
- [ ] Help
  - [ ] Create help section
  - [ ] Write a guide/introduction to each piece of TrackBear
- [ ] Features
  - [ ] Goals: Make it clearer when a (target?) goal has been met (h/t Liv)
  - [X] Leaderboards: Add "everyone has their own goal" mode
  - [X] Graphs: Convert all graphs from chart.js to Plot
  - [X] Graphs: Add "save as image" functionality
  - [X] Profiles: Add opt-in public-facing profile
  - [X] Profiles: Add ability to put projects and goals on your profile
  - [X] General: Make TrackBear a PWA
  - [X] General: Implement theme switcher
- [X] Bug fixes
  - [X] Fix small-number (scene/page/chapter) issues in goal stats
  - [X] Ensure that project starting balances are counted in lifetime stats
  - [X] Fix the double-tooltip overlap bug
- [ ] Admin Help
  - [ ] Create staging server
  - [ ] Implement telemetry
  - [ ] Double-check backups
  - [X] Improve ability to judge app usage

## User-Facing Features
- [ ] Help
  - [ ] Create help documentation
  - [ ] Introduction to TrackBear
  - [ ] Deep dive into each bit of functionality
- [ ] Tallies
  - [ ] Allow logging half-pages (but only for pages probably) (h/t Alex)
  - [ ] Consider the ability to add more than one type of progress at once (h/t Alice)
- [ ] Projects
  - [ ] The project page could be nicer/more informative
  - [X] Better project organization (added sort order) (h/t Ren the Ghost)
  - [ ] Implement project tags (maybe)
  - [ ] Make it clearer on mobile that the edit and delete buttons for tallies are offscreen (or more likely, rejigger the table so it's way more mobile-friendly) (h/t lailah)
- [ ] Goals
  - [ ] Target goal pages could be nicer/more informative
  - [ ] Multiple goals (a la "stretch goals")
  - [ ] Goal pages could be more fun
  - [ ] Split targets and habits
  - [ ] Habit progress gauges need a UI revamp
  - [ ] Make it clearer when a goal has been met (h/t Liv)
- [ ] Leaderboards
  - [ ] Allow owners to remove (or ban?) participants from leaderboards
  - [X] Progress to individual goals
  - [ ] Multiple goals (a la "stretch goals")
  - [ ] Add yourself more than once
  - [ ] Allow board owners to rotate the join code
  - [ ] Group participants into teams and compare team totals (h/t Asha)
  - [ ] Make sure each participant has their own, consistent color and marker across the graph and the progress bar (h/t Arden)
- [ ] Dashboard
  - [ ] Dashboard could be more fun/welcoming
  - [ ] Show starred leaderboards on dashboard
  - [X] Show starred projects on dashboard
  - [ ] Show lifetime counts on dashboard
- [X] Grand Totals page
  - [X] Overall total
  - [ ] Totals by tag
  - [ ] Ability to exempt tags/projects from total
  - [X] Heatmap by year
  - [ ] Totals by year (h/t Deerna)
  - [ ] Graph lifetime progress
- [ ] User settings
  - [ ] Implement theme switcher (including light/dark/system)
    - [ ] Make a strategy for actual color systems: changelog, project phase, goal type, tag color
    - [X] Change hard-coded danger/warning/help/info/secondary/etc.
    - [X] Make the auto/light/dark version
    - [ ] Need to figure out accent vs success vs completion
    - [ ] Definitely need to figure out chart colors somehow
    - [ ] Make the switcher part
    - [X] remove primvevue.css

  - [ ] TinyPNG-ify avatar files to save on space
  - [ ] Implement data export
- [ ] Embeds
  - [ ] Project progress embed (h/t Laura)
  - [ ] Grand Totals embed (h/t Laura)
  - [ ] Progress update widget (h/t Laura)
- [ ] Charts
  - [ ] Rewrite the heatmap to use Plot
- [ ] Improve tag inputs

## Admin Console Features
- [ ] Admin landing page
- [ ] Improve user management
  - [ ] Rename user/displayName
  - [X] Force password reset
  - [ ] Improved audit event retrieval/listings
- [ ] Manage projects, goals, leaderboards
- [ ] Add link to admin console from app UI (maybe)

## Security
- [ ] Make rate-limiting better
- [ ] Lock-out multiple wrong sign-in attempts
- [ ] Add optional TOTP setup

> [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

## Tech Debt/Code Quality
- [ ] Actually write some tests
- [ ] Fix the required-auth page architecture
- [ ] Improve the worker architecture
- [ ] Improve the queue architecture
- [ ] Figure out how to make 'server/*' work on back end imports
- [ ] Make the API more consistent w/r/t PUT, POST, and PATCH
- [ ] Do a better job with shared data/functions
- [ ] De-duplicate form components
- [ ] Expand the model layer in the backend to be used for all db access
- [ ] Create better seed data for testing
- [ ] Use 'omit' in prisma schema to protect password and other secret fields
- [ ] Update date-fns to 4.0
  - [ ] Simplify createDateRanges when this happens

## Observability
- [ ] Create ping check
- [ ] Ship logs somewhere
- [ ] Ship metrics/telemetry somewhere

## Branding
- [ ] Create/commission logo and assets
- [ ] Improve home page
- [ ] Rewrite copy on "outside" pages

## Developer Access
- [ ] API access
  - [ ] Swagger/OpenAPI docs
  - [ ] API tokens

## Deployment/Reliability
- [ ] Create staging instance
- [ ] Improve deployment process
  - [ ] Better diagnostics if something isn't right?
  - [ ] Remote deploys?
- [ ] Zero- or minimal-downtime deploys
