# TODO

## Now
- [X] Release to alpha testers

## Next
- [X] Add project parameters (goal, start date, end date) to Project page
- [ ] Edit and delete for projects and updates
- [ ] Add edit page for users
- [ ] Add `lastLoginAt` to User table
- [ ] Lock out multiple login attempts
- [ ] Simplify out async handling a la https://stackoverflow.com/questions/43356705/
- [ ] Replace the try/catch api call logic in the front-end with something less onerous
- [ ] In-page username validation (https://ui.vuestic.dev/ui-elements/form#async-validation)
- [ ] Put TrackBear behind nginx for easier SSL and fail2ban

## Soon
- [ ] Announcement/banner functionality
- [ ] Project Stats
- [ ] Sharing
- [ ] Leaderboards (types: same type, goal percentage)
- [ ] Aggregate grand totals across all projects / Aggregate by tag / Exclude projects from grand total

## Before stable launch
- [ ] Go over [security practices](https://blog.risingstack.com/node-js-security-checklist/)
  - [ ] Integrate CSRF protection
  - [ ] Double-check Helmet settings
  - [ ] Make rate-limiting better
  - [ ] Lock-out sign-in attempts
- [ ] Prove out migrations on deploy
- [ ] Finalize name
- [ ] Create logo
- [ ] Buy actual domain
- [ ] Set up ko-fi/whatever
- [ ] Finalize color scheme
- [ ] Create staging instance
- [ ] Create seed data for testing that everything looks good
- [ ] Document the heck out of this

# Future
- [ ] API access
- [ ] TOTP
- [ ] Admin area
