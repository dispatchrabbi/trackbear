Changes to make:
- Need to fix edit/create pages for work, goals, etc.
- Work display page should use work store, needs to fetch tallies from tally endpoint, same with goals and boards
- Need to fix profile page
- owner being required is broken — profiles require it to just be an ID
- Create uploading domain/model
- remove/replace getTalliesForGoal
- exile GoalWithWorksAndTags and WorkWithTallies, etc
- delete/undelete should immediately return if the state is already deleted/active