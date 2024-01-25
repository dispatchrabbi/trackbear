# TODO

## Next
- [ ] Dockerize to prepare for a migration to Postgres
  - [X] Dockerize Trackbear
  - [ ] Create LOG_TO_CONSOLE env var for better debug & container experience
  - [ ] Change docker-compose files to have a base file + dev and prod overwrites
- [ ] Edit your account
- [ ] Delete your account

## Soon
- [ ] Code quality improvements
  - [ ] Replace the try/catch api call logic in the front-end with something less onerous
  - [ ] Make an async error handler wrapper for the backend api handlers so the try/catches can be removed
  - [ ] Harmonize the front end and back end naming conventions
  - [ ] Make the worker and queue architectures... better
  - [ ] Do a better job with shared data/functions
  - [ ] Figure out how to make 'server/*' work on back end imports
- [ ] In-page username validation (https://ui.vuestic.dev/ui-elements/form#async-validation)

## Admin console
- [ ] User management
  - [ ] Suspend/activate account
  - [ ] Send emails
  - [ ] Rename user
  - [ ] Force password reset
  - [ ] View audit events

## Switch to tag-and-tally
- [ ] Database and API entities for tag-and-tally
- [ ] Dashboard page
  - [ ] Submit tally
  - [ ] Streak counter
  - [ ] Activity (like Github's calendar choropleth)
- [ ] Project views: create, edit, view, delete (?)
- [ ] Boards: create, edit, view, delete (?)
- [ ] Multiplayer boards: add, remove, share
- [ ] Grand total page
  - [ ] Overall total
  - [ ] Totals by tag
  - [ ] Ability to exempt tags/projects from total

## Before stable launch
- [X] Figure out email sending
- [X] Make sure sign-ups validate the email address
- [ ] Go over [security practices](https://blog.risingstack.com/node-js-security-checklist/)
  - [X] Integrate CSRF protection (no need, JSON APIs are CORS-locked, see: https://github.com/pillarjs/understanding-csrf#use-only-json-apis)
  - [X] Double-check Helmet settings
  - [ ] Make rate-limiting better
  - [ ] Lock-out sign-in attempts
- [X] Prove out migrations on deploy
- [X] Finalize name
- [ ] Create logo
- [ ] Buy actual domain
- [ ] Set up ko-fi/whatever
- [ ] Finalize color scheme
- [ ] Create staging instance
- [ ] Create seed data for testing that everything looks good
- [ ] Document the heck out of this

# Future
- [ ] Observability
  - [ ] Ship logs somewhere
  - [ ] Ship metrics/telemetry somewhere
- [ ] API access
- [ ] TOTP
