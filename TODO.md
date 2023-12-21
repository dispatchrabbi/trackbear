# TODO

## Front-end mockups
- [X] Add routing
- [X] Account page
- [X] Login page
- [X] Password reset page

## Back-end API
- [X] User info and login API
- [X] Projects API
- [X] Audit events

## Wire up front-end to back end
- [X] Login
- [X] Signup
- [X] Projects page
- [X] New project
- [X] Project page
- [X] Add entry
- [X] Consistent error messaging
- [ ] Create seed data for testing that everything looks good

## Deploy
- [X] Productionalize the service
  - [X] Add rate limits
  - [X] Logging
  - [X] Figure out how Vite wants to act in production
- [X] Figure out how and where to deploy this
  - [X] If behind a proxy, set app.set('trust proxy', 1) in Express
- [X] Create domain
- [ ] Prove out deploy & migrations
  - [X] Manual update process
  - [X] Create update script
  - [ ] Prove out migrations
- [ ] ...Dockerize?

## Polish
- [X] Change over client-side validation to Zod
  - [X] I missed the Enter Progress form
- [X] Loading status in the forms
- [X] Make API responses consistent and examine return codes
  - [ ] Simplify out async handling a la https://stackoverflow.com/questions/43356705/node-js-express-error-handling-middleware-with-router
- [X] Look at all "null" states
- [X] Ensure dark mode is usable
- [X] Add landing page
- [ ] Go over [security practices](https://blog.risingstack.com/node-js-security-checklist/)
  - [ ] Integrate CSRF protection
  - [ ] Double-check Helmet settings
  - [ ] Make rate-limiting better
  - [ ] Lock-out sign-in attempts
- [ ] Release to alpha testers

## Future
- [ ] Announcement/banner functionality
- [ ] Replace the try/catch api call logic in the front-end with something less onerous
- [ ] Project Stats
- [ ] Sharing
- [ ] Leaderboards (types: same type, goal percentage)
- [ ] In-page username validation (https://ui.vuestic.dev/ui-elements/form#async-validation)
- [ ] Finalize name
- [ ] Create logo
- [ ] Buy actual domain
- [ ] Set up ko-fi/whatever
- [ ] Finalize color scheme
- [ ] Create staging instance too
- [ ] Document the heck out of this
- [ ] API access
- [ ] TOTP
- [ ] Admin area
