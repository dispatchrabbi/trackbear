# TODO

## Next
- [X] Leaderboards:
  - [X] Create, edit, delete, close invites
  - [X] Let others join the board
  - [X] Add "Join" button to the list page
  - [X] Restrict measures per board
  - [X] Show avatars beside progress
  - [X] Add user avatars on board tile
  - [X] Fix board starring so owners and participants can star
  - [X] Change "boards" to "leaderboards"
- [ ] Admin user management
  - [X] Suspend/activate account
  - [X] Delete/restore account
  - [X] Send emails
  - [ ] Rename user
  - [ ] Force password reset
  - [X] View audit events more nicely
  - [X] Add session ID to audit events

## Soon
- [ ] Fix the required-auth page architecture
- [ ] Observability
  - [ ] Ship logs somewhere
  - [ ] Ship metrics/telemetry somewhere
- [ ] Grand total page
  - [ ] Overall total
  - [ ] Totals by tag
  - [ ] Ability to exempt tags/projects from total
- [ ] Implement project tags
- [ ] Show starred projects on dashboard
- [ ] Show starred boards on dashboard
- [ ] Allow owners to remove participants from the board
- [ ] Code quality improvements
  - [X] Make an async error handler wrapper for the backend api handlers so the try/catches can be removed
  - [X] Harmonize the front end and back end naming conventions
  - [ ] Make the worker and queue architectures... better
  - [ ] Do a better job with shared data/functions
  - [ ] Figure out how to make 'server/*' work on back end imports
  - [ ] Make the API more consistent w/r/t PUT, POST, and PATCH
  - [ ] De-duplicate form components
  - [ ] Expand the model layer in the backend to be used for all db access

# Future
- [ ] API access
- [ ] More for boards:
  - [ ] Progress to individual goals
  - [ ] "Fundraiser mode" (everyone's progress contributes)
  - [ ] Add yourself more than once
  - [ ] Public board sharing

# Security and o11y
- [ ] Go over [security practices](https://blog.risingstack.com/node-js-security-checklist/)
  - [X] Integrate CSRF protection (no need, JSON APIs are CORS-locked, see: https://github.com/pillarjs/understanding-csrf#use-only-json-apis)
  - [X] Double-check Helmet settings
  - [ ] Make rate-limiting better
  - [ ] Lock-out sign-in attempts
- [ ] TOTP
- [ ] ...passkeys?!

## Branding
- [ ] Create/commission logo and assets
- [ ] Finalize color scheme

## Doing this like a real thing
- [ ] Create better seed data for testing
- [ ] Actually write some tests (ha)
- [ ] Create staging instance
- [ ] Document the heck out of this
