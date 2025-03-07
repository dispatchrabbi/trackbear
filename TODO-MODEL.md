Changes to make:
- [x] Need to fix edit/create pages for work, goals, etc.
- [x] Work display page should use work store, needs to fetch tallies from tally endpoint, same with goals
- [x] Need to fix profile page
- [ ] owner being required is broken — profiles require it to just be an ID
- [ ] Create uploading domain/model
- [ ] remove/replace getTalliesForGoal
- [x] exile GoalWithWorksAndTags and WorkWithTallies, etc
- [ ] delete/undelete should immediately return if the state is already deleted/active
- [x] unify goals and boards with workIds/tagIds vs works/tags and unify helpers