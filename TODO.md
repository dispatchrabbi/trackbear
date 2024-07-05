# TODO

These are in no particular order. Which isn't to say they _aren't_ in any order. But it would be wise not to read too far into the order they _are_ in.

## User-Facing Features
- [ ] Create help documentation
- [ ] Projects
  - [ ] The project page could be nicer/more informative
  - [ ] Implement project tags (maybe)
- [ ] Goals
  - [ ] Target goal pages could be nicer/more informative
  - [ ] Goal pages could be more fun
  - [ ] Split targets and habits
  - [ ] Habit progress gauges need a UI revamp
- [ ] Leaderboards
  - [ ] Allow owners to remove (or ban?) participants from leaderboards
  - [ ] Progress to individual goals
  - [ ] "Fundraiser mode" (everyone's progress contributes)
  - [ ] Add yourself more than once
- [ ] Dashboard
  - [ ] Dashboard could be more fun/welcoming
  - [ ] Show starred leaderboards on dashboard
  - [ ] Show starred projects on dashboard
- [ ] Grand Totals page
  - [ ] Overall total
  - [ ] Totals by tag
  - [ ] Ability to exempt tags/projects from total
- [ ] User settings
  - [ ] Implement theme switcher (including light/dark/system)
  - [ ] TinyPNG-ify avatar files to save on space
- [ ] Improve tag inputs
- [ ] Replace chart.js line graphs with d3- or d3/plot-driven ones
- [ ] Add a little red dot when there's been an update

## Admin Console Features
- [ ] Admin landing page
- [ ] Improve user management
  - [ ] Rename user/displayName
  - [ ] Force password reset
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
