# TODO

## Next
- [X] Basic mobile styles
- [ ] Build/deploy improvements:
  - [ ] Graceful start (wait-ready) and shutdown: https://pm2.keymetrics.io/docs/usage/signals-clean-restart/
  - [ ] Pre-push or pre-commit build hook
- [ ] Edit your account
- [ ] Delete your account

## Soon
- [ ] Create an admin console
  - [ ] Announcement/banner functionality
- [ ] Replace the try/catch api call logic in the front-end with something less onerous
- [ ] In-page username validation (https://ui.vuestic.dev/ui-elements/form#async-validation)
- [ ] Password reset

## Switch to tag-and-tally
- [ ] Switch over to the tag-and-tally system of updates
- [ ] Aggregate grand totals / Aggregate by tag / Exclude projects from grand total

## Before stable launch
- [ ] Figure out email sending
- [ ] Make sure sign-ups validate the email address
- [ ] Go over [security practices](https://blog.risingstack.com/node-js-security-checklist/)
  - [X] Integrate CSRF protection (no need, JSON APIs are CORS-locked, see: https://github.com/pillarjs/understanding-csrf#use-only-json-apis)
  - [X] Double-check Helmet settings
  - [ ] Make rate-limiting better
  - [ ] Lock-out sign-in attempts
- [X] Prove out migrations on deploy
- [ ] Finalize name
- [ ] Create logo
- [ ] Buy actual ORIGIN
- [ ] Set up ko-fi/whatever
- [ ] Finalize color scheme
- [ ] Create staging instance
- [ ] Create seed data for testing that everything looks good
- [ ] Document the heck out of this

# Future
- [ ] API access
- [ ] TOTP
- [ ] Admin area
