Changes to make:
- Create tag store on front end
- Work display page should use work store, needs to fetch tallies from tally endpoint, same with goals and boards
- Create uploading domain/model
- remove/replace getTalliesForGoal
- exile GoalWithWorksAndTags and WorkWithTallies, etc
- delete/undelete should immediately return if the state is already deleted/active