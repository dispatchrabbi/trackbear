# TODO

## Front-end mockups
- [X] Add routing
- [X] Account page
- [X] Login page
- [X] Password reset page

## Back-end API
- [X] User info and login API
- [X] Projects API
- [ ] Audit events

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
  - [ ] Create build step for backend AND frontend
  - [ ] Prove out migrations
- [ ] ...Dockerize?

## Polish
- [X] Change over client-side validation to Zod
- [ ] Loading status in the forms
- [ ] Make API responses consistent and examine return codes
- [ ] Look at all "null" states
- [ ] Ensure dark mode is usable
- [ ] Announcement/banner functionality
- [X] Add landing page
- [ ] Go over [security practices](https://blog.risingstack.com/node-js-security-checklist/)
  - [ ] Integrate CSRF protection
  - [ ] Double-check Helmet settings
  - [ ] Make rate-limiting better
  - [ ] Lock-out sign-in attempts
- [ ] Release to alpha testers

## Future
- [ ] Finalize name
- [ ] Create logo
- [ ] Buy actual domain
- [ ] Set up ko-fi/whatever
- [ ] Finalize color scheme
- [ ] Create staging instance too
- [ ] Document the heck out of this
- [ ] Sharing
- [ ] Leaderboards (types: same type, goal percentage)
- [ ] Project Stats
- [ ] API access
- [ ] TOTP
- [ ] Admin area
