# TODO

## Next
- [ ] Admin user management
  - [ ] Suspend/activate account
  - [ ] Send emails
  - [ ] Rename user
  - [ ] Force password reset
  - [ ] View audit events
- [ ] Improve goal pages
- [ ] Implement project tags

## Soon
- [ ] Boards: create, edit, view, delete (?)
- [ ] Multiplayer boards: add, remove, share
- [ ] Grand total page
  - [ ] Overall total
  - [ ] Totals by tag
  - [ ] Ability to exempt tags/projects from total
- [ ] Edit your account
- [ ] Delete your account
- [ ] Code quality improvements
  - [ ] Replace the try/catch api call logic in the front-end with something less onerous
  - [X] Make an async error handler wrapper for the backend api handlers so the try/catches can be removed
  - [X] Harmonize the front end and back end naming conventions
  - [ ] Make the worker and queue architectures... better
  - [ ] Do a better job with shared data/functions
  - [ ] Figure out how to make 'server/*' work on back end imports

# Future
- [ ] API access

# Security and o11y
- [ ] Go over [security practices](https://blog.risingstack.com/node-js-security-checklist/)
  - [X] Integrate CSRF protection (no need, JSON APIs are CORS-locked, see: https://github.com/pillarjs/understanding-csrf#use-only-json-apis)
  - [X] Double-check Helmet settings
  - [ ] Make rate-limiting better
  - [ ] Lock-out sign-in attempts
- [ ] Observability
  - [ ] Ship logs somewhere
  - [ ] Ship metrics/telemetry somewhere
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
