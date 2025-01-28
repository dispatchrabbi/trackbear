Changes to make:
- [x] Need to fix edit/create pages for work, goals, etc.
- [x] Work display page should use work store, needs to fetch tallies from tally endpoint, same with goals
- [ ] Eventually boards too but from /boards/:uuid/tallies
- [x] Need to fix profile page
- [ ] owner being required is broken — profiles require it to just be an ID
- [ ] Create uploading domain/model
- [ ] remove/replace getTalliesForGoal
- [ ] exile GoalWithWorksAndTags and WorkWithTallies, etc
- [ ] delete/undelete should immediately return if the state is already deleted/active