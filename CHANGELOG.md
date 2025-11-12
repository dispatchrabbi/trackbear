# CHANGELOG

This file lists notable changes to TrackBear in each version. TrackBear uses romantic versioning, so don't read too far into the version numbers.

Types of changes include:
- NEW, for new features
- CHANGED, for changes in existing functionality
- FIXED, for bug fixes
- DEPRECATED, for soon-to-be-removed features
- REMOVED, for features that have been removed
- SECURITY, for vulnerabilities or other security updates

## Upcoming/Unreleased

## 1.4.7

- FIXED: Bar chart tooltips now show up where they ought to, instead of slightly above that day's bar. The tooltips are now once again at the top of the bars as well. Hopefully this is the last fix to bar charts for a while! (h/t Amaras)
- FIXED: The `startDate` and `endDate` query parameters for the `GET /api/v1/stats/days` API endpoint now actually filter the results. (h/t Preocts)

## 1.4.6

- CHANGED: The standings for leaderboards now show all participants' progress as it is shown on the chart, even if some of that progress is in the future from your perspective. The standings changes are versus your yesterday. This one's for you, global writer communities. (h/t varve and various others in the Rogue Writers discord)
- FIXED: Bar charts for leaderboards now show bars for all participants, stacked. (h/t Amaras)

## 1.4.5

- FIXED: Fixed a bug where leaderboard charts were being rendered too correctly when a participant had a goal of 0 (meaning that their progress would always be ∞%). Participants with a goal of 0 will now sit at 0% progress and have a standing of 'N/A'. (h/t Lara)

## 1.4.4

- FIXED: Fixed a bug that sometimes caused chart tooltips for the par line to be one day behind where they should be for users in the eastern hemisphere. (h/t Elluna, Etlu-Yume)

## 1.4.3

- CHANGED: When creating a new project or goal, you are now taken to that project or goal's page after creation. This matches the already-existing behavior for leaderboards.
- CHANGED: If you only have one project, the Enter Progress dialog will automatically select that project. (h/t Lara)
- FIXED: Fixed a bug that sometimes caused chart tooltips to be one day behind where they should be. (h/t Chaotics)
- FIXED: Very long leaderboard descriptions no longer overflow their cards on the leaderboard list page. (h/t Lady Jane)

## 1.4.2

- CHANGED: The leaderboard and goals pages now separate their lists into starred, ongoing, and ended sections. (h/t DemonEmpressTheordora)

## 1.4.1

- FIXED: Fixed a bug that sometimes caused graph axes to be one day behind where they should be for users in the eastern hemisphere. (h/t LucyGodwing)

## 1.4.0

- NEW: Teams have come to leaderboards! You can now make teams for your leaderboard and assign your members to those teams, or let your members assign themselves. When teams are enabled, leaderboard charts will show totals and progress by team rather than by member. Teams are available for all kinds of leaderboards, even in individual goal mode! (h/t Asha)
- CHANGED: When saving a chart, the image now has some extra padding.
- FIXED: When saving a chart in dark mode, the image now has the correct colors. (h/t Alexandra)

## 1.3.11

- CHANGED: After creating a leaderboard, you will now be redirected to that leaderboard instead of to the list of leaderboards.
- FIXED: Fixed a bug that would remove your leaderboard goal if you starred or unstarred a leaderboard. If you recently starred or unstarred a loaderboard where you have an individual goal, you should go reset it. Sorry about that! (h/t Cassie Cassette)

## 1.3.10

- NEW: You can now set a display name for each leaderboard you're on. If you don't set one, your account's display name will be used.
- NEW: You can now pick your own color on a leaderboard!
- CHANGED: The submit button on various edit forms (like Edit Project and Edit Goal) now reads "Save" for better clarity. (h/t Binna)
- CHANGED: Uploaded covers and avatars will now be minified/optimized to a smaller file size. This should not impact quality but if you see any issues, please let me know.

## 1.3.9

- CHANGED: (**BREAKING**) The `GET /project/:id` API route now only returns data about the project itself. You'll need to use `GET /tally` to get the tallies associated with that project. (This technically should require versioning the endpoint, but my logs show that no one is using it. Sorry if this breaks your code!)

## 1.3.7

- NEW: You can now set what day the week should start on for the purposes of your dashboard and habit goals. (h/t Hester van Bork)

## 1.3.5

- FIXED: The colors on the chart for a leaderboard in fundraiser mode now match the colors on the bar below it. (h/t Keelia)
- FIXED: The data on the chart for a leaderboard in fundraiser mode now correctly stops when there's no more data. (h/t Keelia)
- REMOVED: The NaNoWriMo import functionality has been removed, as the sites are no longer accessible. Manual import is still available, and a more generic import is coming soon.

## 1.3.4

- FIXED: Percentages in area and bar charts are now limited to 2 decimal places. (h/t Starlight)

## 1.3.3

- NEW: You can now view any chart as a bar chart, so you can see your total progress each day.
- NEW: You can now make any chart fullscreen. Hopefully this helps mobile users a bit!
- NEW: You can now click the save button near a chart to download an image of that chart.

## 1.3.2

- CHANGED: Added a few metrics on the back end so I can track things like response duration.
- FIXED: API keys that never expire will now actually work.
- FIXED: The try-it-out functionality of the API docs is no longer thwarted by CORS.

## 1.3.1
- FIXED: API docs now render both on first load and on reload.

## 1.3.0

- NEW: API access for developers is finally here! Read all about it at [the API Docs](https://help.trackbear.app/api)!
- NEW: Users can create API keys, which allow integrations and other applications to access their TrackBear account on their behalf.
- CHANGED: Pages under `/works` are now under `/projects`. The old URLs will redirect for a while, but you should update your bookmarks.
- FIXED: White, black, and brown tags are now correctly colored, and the colors of all the tags have been tweaked. (h/t Mathias)

## 1.2.8
- FIXED: Item in the user menu now work when you click anywhere on them, not just on text.
- CHANGED: Settings pages (Account, Settings, Tags) now have a settings-specific sidebar to more easily navigate between them.
- FIXED: Heatmaps now behave correctly for negative data.

## 1.2.7
- NEW: Leaderboard owners can now manage the memberships of their boards. Specifically, they can promote other members to owner and remove members.

## 1.2.6
- FIXED: Project cover image sizes that are not the right aspect ratio are now centered when displayed. (h/t Seraphle)
- FIXED: Activity heatmaps for projects finished more than a year ago now display progress for the correct date range. (h/t Seraphle)
- FIXED: The Dashboard activity heatmap coloring now correctly takes into account progress other than words.

## 1.2.4
- NEW: Added a background job to minify uploaded images and prune unused uploaded images.
- CHANGED: The activity heatmap has been updated to have nicer tooltips and use the same chart library as the rest of TrackBear.
- CHANGED: Activity heatmaps on projects will not continue past the last day of activity if the project is finished, on hold, or abandoned. (h/t Starlight)
- CHANGED: The "Copy Join Code" button on leaderboard pages has been replaced with a "View Join Code" button that show you both the join code and a direct join link and let you copy them to the clipboard.

## 1.2.3
- FIXED: Leaderboard standings now shows the correct count total for the selected measure, instead of a total of all measures. (h/t Lucile, romana)

## 1.2.1
- FIXED: The Join Leaderboard page now correctly displays a form for the join code.

## 1.2.0

- NEW: The backend for leaderboards has been entirely rewritten, and so has much of the front-end. This will make it much easier to add highly-requested features, such as per-leaderboard display names, choosing your own graph color, leaderboard teams, and allowing leaderboard owners to manage leaderboard members.
- NEW: The leaderboard standings now shows how many places up or down each participant has moved since the day before.
- CHANGED: Editing, deleting, and leaving a leaderboard, as well as editing your participation, are now condensed under a single "Configure Leaderboard" button.
- CHANGED: You can now join a leaderboard as a spectator. To do so, toggle the "Are you participating in this leaderboard?" switch off when editing your participation. Spectators will be listed as members of the leaderboard on the detail page, but will not appear on the chart or standings table.
- REMOVED: It is no longer possible to view a leaderboard you are not a member of. That is, the previous "Can people view without joining?" setting now has no effect and has been removed. To replace this, in addition to the spectator option above, you will also soon be able to set a leaderboard to be viewable without logging in.

## 1.1.22

- CHANGED: Added the ability for admins to force-verify accounts.

## 1.1.20

- NEW: Added an automatic importer for the NaNoWriMo Young Writers Program. Special thanks to Jenai for helping me with some of the context around YWP.

## 1.1.19

- CHANGED: The way that leaderboard owners are represented in the database is changing a bit, and this is the first half of that change. Normally I don't put changes that are only on the backend and transparent to users on the changelog, but in this case, I want to be extra wary of any inadvertant bugs that my testing didn't catch. If you encounter a bug with leaderboards, whether that's creating, configuing, joining, leaving, deleting, or anything else, please send a bug report to the email address on the [Contact](/contact) page. Thank you!

## 1.1.17

- FIXED: Fixed a bug in the password reset flow. (h/t Saski)

## 1.1.16

- FIXED: Logging in with an incorrect username or password now shows the correct error. (h/t my_w)

## 1.1.15

- NEW: Yearly totals have been added to the Lifetime Stats page. (h/t Deerna, azaleavalaine)
- NEW: Added a setting to hide project covers, so that you don't have "grey bears staring into my soul every time I open that page" (as one user put it) if you don't intend to upload covers. (h/t Liv)
- NEW: Added a setting to hide streaks on the Dashboard, which is useful if breaking a streak is a demotivator for you. (h/t Elodie)

## 1.1.14

- FIXED: Goals on the Dashboard now show progress correctly bounded by the start and end dates of the goals. (h/t EtluYume, Elluna)

## 1.1.13

- FIXED: The current and new passwords in the Change Password section of the Account page now clear after you successfully change your password.
- CHANGED: A lot of behind-the-scenes things to hopefully make things a bit smoother and faster, and to prepare the backend for use via API key. More backend work to come, which should make it much easier to build in some of the most-requested feature requests (especially with regards to leaderboards).
- SECURITY: TrackBear will no longer log you out unless you haven't visited for a whole week. If you get one day a week to write, this one's for you! (h/t Robot)

## 1.1.11

- FIXED: On leaderboards in Fundraiser mode, the participant with the highest contribution is now actually at the bottom of the graph, instead of at the top. (h/t Arden)

## 1.1.9

- CHANGED: The base color on calendar heatmaps now doesn't stand out so much.
- FIXED: The tooltips on leaderboards in Fundraiser Mode now show up at the correct place. In fact, tooltips in general are looking much better.
- FIXED: The order of participants in the graph, the progress meter, and the standings should all now be stable on leaderboards in Fundraiser mode. The participant with the highest contribution will be at the bottom of the graph, the front of the progress meter, and the top of the standings.

## 1.1.8

- CHANGED: Added some new fun pace conversions to the target goal stats.
- FIXED: The stats on finished target goals were off by a bit; they've now been fixed. (h/t galaxygnc)
- FIXED: The ratio of Mars Sols to Earth days has been corrected.

## 1.1.7

- FIXED: Fixed a bug that prevented users from requesting additional verification links. (h/t kweikel)

## 1.1.6

- FIXED: The erroneous "You haven't made any projects yet. Click the New button to get started!" message at the bottom of the Projects page has been removed. (h/t AngelDragon, James)
- FIXED: A loading message should now appear on the Projects, Goals, and Leaderboards pages when those pages are loading data.

## 1.1.3

- FIXED: Target goal meters on the Dashboard now once again span the whole width of the screen. (h/t Etlu-Yume)

## 1.1.2

- FIXED: Fixed a situation where slow response times (due to waiting on a database pool connection) were causing users to be logged out. While the site may still load a bit slow in places (notably the Dashboard and Goals pages), at least it won't kick people out now. (h/t callmecayce)

## 1.1.1

- NEW: Goals now display whether they are upcoming, ongoing, achieved, or ended (which means that time ran out but the target was not hit) on the Goals page. (h/t Liv)
- CHANGED: Goals are now sorted by completion status (upcoming, ongoing, achieved, or ended) on the Goals page, Dashboard, and sidebar.

## 1.1.0

- NEW: Target goal pages now display information about how much you've contributed toward the goal that day. (h/t Matt Granger)
- CHANGED: The information on target goal pages is now more context-aware, and will change once a goal has completed or ended. (h/t Liv)
- FIXED: Users will now be correctly redirected to the login page when attempting to access a page that requires you to be logged in instead of seeing a blank page. (h/t Taylor)
- FIXED: Fixed a bug that would prevent login when redirecting to the Projects page.

## 1.0.9

- CHANGED: Projects that are On Hold, Finished, or Abandoned will no longer be listed in the Project dropdown of the Add Progress dialog, unless you are on that project's page. This should make it easier to find the project you're working on if you have lots of past projects. (h/t Dutchnano)

## 1.0.7

- NEW: There is now a link to the help site in the footer on the homepage and other logged-out pages.
- NEW: There is now a "Locked out?" link to the help site on the login page.
- CHANGED: The links to the About, Privacy, and Contact pages have been returned to the user menu.

## 1.0.6

- CHANGED: The _Set new project total?_ toggle on the Add Progress dialog will now save the last setting you used. (h/t Courtney)
- FIXED: The Upload Cover dialog now correctly is titled "Upload Cover" instead of "Upload Avatar".

## 1.0.5

- NEW: Leaderboards now have a standings number for easy reference. (h/t frenchkey, cenlyra, Jenai)

## 1.0.4

- CHANGED: The first month on a heatmap is now a bit to the left, to avoid collisions. The font is also a bit smaller. (h/t Misupstairs)

## 1.0.3

- FIXED: The "last updated" sort for projects now sorts the last updated project to the *top*. Whoops. (h/t AngelDreamer)

## 1.0.2

- FIXED: Fixed an issue that caused profiles not to display if they would have shown a habit with no progress.

## 1.0.0

- NEW: TrackBear is no longer in beta! The "beta" tag has been removed from the masthead. A huge thank you to everyone who has been using TrackBear, sending suggestions and bug reports, posting about it on social media, and supporting me on Ko-Fi. Your support and enthusiasm means the world to me. 💜💜💜 ʕᵔᴥᵔʔ
- NEW: TrackBear has help docs now! You can find them at https://help.trackbear.app/, and there's also a link in the user menu. Thank you to RiddleRose for writing the Getting Started guide. (h/t RiddleRose)

## 0.17.1

- CHANGED: I have updated the [Privacy](/privacy) page to be more specific about what data is collected and how it's used. I have not begun collecting new or different data, but I am using the data I already collect in different ways. This update also adds some technical details for the curious.

## 0.17.0
- NEW: You can now upload cover art for your projects! For best results, cover art should have a 2:3 ratio (mimicking a 6"x9" trade paperback); a 320x480px image will work great.

## 0.16.6

- FIXED: The reminder banner for unverified accounts on the Dashboard now appears when it is supposed to.

## 0.16.5

- CHANGED: TrackBear's logo will now change to a polar bear for the dark theme.

## 0.16.4

- FIXED: Some users on older browsers were experiencing issues getting TrackBear to load. Those users should now be able to access TrackBear without issues (although I don't have older browsers to test on, so it's tough for me to test this or give exact browser version ranges). As always, the best way to make sure you can access TrackBear is to keep your browser up to date.

## 0.16.3

- NEW: You can now set your theme! No longer will you be at the mercy of your system's theme. You can select between light mode, dark mode, and auto under Settings. Note that the setting applies per device, so if you access TrackBear on multiple devices, you may need to set it multiple times.
- FIXED: The theme switcher is back! Calling this both "new" and "fixed" is a little cheeky, but for the true OGs who remember the December 2023 version of TrackBear, this is the last piece of functionality I had left to achieve parity. Sorry it took so long!

## 0.16.1

- NEW: You can now sort your projects page by phase, title, or last updated. For "last updated", projects that have never been updated will be last. (h/t Ren the Ghost)
- NEW: Projects can now be in "planning" and "outlining" phases. Colors for each phase have also been tweaked slightly. (h/t Inkyrius)
- CHANGED: Starred projects, goals, and leaderboards in the sidebar are now sorted by title.
- CHANGED: Goals and leaderboards are now sorted by title on their list pages, with starred items first.
- CHANGED: Projects in dropdowns (such as in the Enter Progress dialog and when creating a new goal) are now sorted by title, with starred items first. (h/t Robot)
- CHANGED: Tags in dropdowns (such as in the Enter Progress dialog and when creating a new goal) are now sorted by name.

## 0.16.0

- NEW: Leaderboards now allow participants to set their own goals! If you are running a community event where everyone sets their own goals, but you want a community leaderboard, this feature is for you. You can find the setting when you make a new leaderboard or configure an existing one. If you change an existing leaderboard to individual goal mode, existing participants will have to set their own goals before they show up on the leaderboard, which they can do under "Edit Your Participation".
- CHANGED: The "Edit Filters" button on the Leaderboard page now reads "Edit Your Participation".
- FIXED: The x-axis for project, goal, and leaderboard graphs will no longer accidentally be shifted earlier by a day.

## 0.15.5

- FIXED: Tooltips for the par line and participant progress will no longer overlap. You should now only see one tooltip at a time. (h/t AbagailHunter, anchorlightforge, Samantha)
- FIXED: The x-axis for graphs will no longer (misleadingly) include the time. (h/t anchorlightforge)

## 0.15.4

- FIXED: Target goal graphs on profile pages are now accurate again. They had been counting the total progress each day as the additional progress each day, resulting in much higher counts than actual. (h/t Tea)

## 0.15.2

- NEW: You can now install TrackBear as an app on your computer or phone. Look for "Add to Home Screen" or "Install TrackBear" buttons; the way to install TrackBear will differ by OS and browser. (h/t Judy L. Mohr)
- NEW: Added an Enter Progress button to the sidebar so that it's more obvious how to do that.

## 0.15.1

- NEW: Leaderboards in fundraiser mode now show their totals.
- CHANGED: The progress table on project pages is now paginated.
- FIXED: The streak counter for habit goals on the dashboard no longer dumps a bunch of unrelated text and instead now gives a cheery "X in a row!" counter like it's supposed to. (h/t CaitSidhe, sarah, Quinoafox)
- FIXED: Lifetime stats now take into account starting balances from your projects as well as your lifetime starting balance in your Settings. (h/t RJ)
- FIXED: Public profiles now also take into account starting balances from your projects; they accidentally did not before.

## 0.15.0
- NEW: Public profiles have launched! You can now enable your public profile in Settings. Once you do, your public profile will be available at trackbear.app/@[your username]. Profiles list lifetime stats by default, and you can add goals and projects to it by going to the goal or project, clicking **Configure**, and toggling the switch under "Show on profile?".

## 0.14.2
- NEW: If you hold down alt/option and double-click on any chart or heatmap, it will download a PNG of that chart. This is a bit of a hidden/preview feature right now (and doesn't work on mobile, due to needing to hold down alt), but it lays the groundwork for some future stuff, and is also a nice way to get a chart without needing to do a screenshot.
- CHANGED: All charts are now using Observable Plot, and have now been made consistent with the Leaderboard chart. They're still not *exactly* where I want them, but nothing is broken and it'll be easier to modify them all from here in one go.
- CHANGED: Leaderboards now have many more colors to use for participants.

## 0.14.1
- CHANGED: Target goals for scenes, pages, and chapters will now display average pace to 2 decimal places, and will no longer erroneously tell you that you have an eternity to reach your goal even though you have, in fact, been making progress toward it. (h/t Sam)

## 0.14.0

- NEW: There's a new Lifetime Stats page! This will show you your lifetime totals and yearly activity heatmaps. There will be more to come here soon!
- NEW: If you have been tracking your writing for a long time, you may have stats from before using TrackBear. Add your lifetime starting balance in the new Settings page (find it under the user menu in the top right) and it'll be added to your totals on the Lifetime Stats page.

## 0.13.3

- FIXED: Fixed a bug that made it impossible to join boards using the code. (h/t Jagodzianka)

## 0.13.0

- NEW: You can now enter progress in scenes and lines. Screenwriters and poets rejoice! (h/t Penny Gotch)
- NEW: The Changelog entry in the user menu will show when TrackBear has been updated (and the avatar will get a little sparkle icon too).
- FIXED: Fixed a bug where it would take two clicks on the sidebar to get from one starred project, goal, or leaderboard to another. (h/t Binna)

## 0.12.3

- FIXED: Fixed the manual NaNoWriMo import to account for differences in how Firefox, Chrome, and Safari copy/paste text off of the NaNoWriMo page.
- FIXED: Fixed the cause of a warning emitted by the chart library TrackBear uses for Leaderboards. (h/t Eirin)

## 0.12.0

- NEW: You can now import projects to TrackBear from NaNoWriMo! Go to the Projects page and hit the Import button. You can import projects automatically, or manually by copy-paste.

## 0.11.6

- FIXED: In cases where multiple progress entries were made in a single day, the graph on leaderboards would only show the first entry. The graph now shows the correct total. (h/t Athena)
- FIXED: The leaderboard chart no longer overflows into the standings on mobile. (h/t cenlyra)

## 0.11.5

- FIXED: Tooltips on the new leaderboard graphs are now readable in dark mode.
- FIXED: The tabs on the leaderboard page now show the correct graphs and stats, instead of that for a different measure. (h/t einhornlasagne, diannethegeek)

## 0.11.4

- NEW: Leaderboards now have Fundraiser Mode, where everyone's progress counts toward the goal — play co-op instead of versus!
- FIXED: Fixed a bug where target graphs accidentally would count progress no matter what measure was used. This has been fixed and graphs should now be accurate again. (h/t misupstairs)

## 0.11.3

- FIXED: Heatmaps would show progress on the day before for users in timezones ahead of UTC. Heatmaps now should work correctly in all timezones. Sorry, Australians! (h/t EosLaetitia)

## 0.11.2

- FIXED: Some leaderboard-related links pointed to outdated URLs. These have now been fixed. (h/t kasperdskod007)

## 0.11.0

- FIXED: Fixed a bug where starting balances weren't taken into account when adding or editing progress and using the "set as total" option. If you have used this option with a project that has starting balances, you should check to make sure your totals are still accurate. Sorry about this, and thank you to wishonadarkstar for pointing out this bug. (h/t wishonadarkstar)

## 0.10.1

- CHANGED: Updated the copy on the homepage.

## 0.10.0

- NEW: Leaderboards! Now you and your friends can track your progress together on the same graph. Race your writing partner to a goal, get your whole writing group involved, or keep each other accountable by creating a leaderboard. Once you've created a leaderboard, your friends can join it using the leaderboard's join code, which you can copy from the leaderboard's page.
- CHANGED: The activity heatmap has been revamped so it's easier to work with and add features to. The tooltips aren't as nice anymore, but I will be going back and adding better tooltips later.
- CHANGED: The "Edit" buttons for projects and goals have been renamed "Configure" and the pencil icon has been replaced with a gear icon. "Account Settings" under the user menu was renamed "Account" and the gear icon has been replaced with an icon of a person.

## 0.9.13

- NEW: You can now change your username, display name, and email address.
- NEW: You can also upload a custom avatar! This is fun in general, but will come in handy with the planned multi-user leaderboard features.
- NEW: You can now delete your account.
- CHANGED: When a user gets redirected to login, they will now return to the page they were on when they got redirected after logging back in again, instead of landing at the Dashboard. They will even be correctly redirected if they need to go through signup; this is to prepare for sharing TrackBear links in the future.
- FIXED: Habit goals on the Dashboard with an end date will now show the most recent 5 days, not the last 5 days of the goal. (h/t EosLaetitia)
- SECURITY: Sessions now expire after 48 hours, but the expiration is also now reset every time a user takes an action. The upshot here is that a user who is adding progress every day (with a grace period) will never get logged out, but users who do not will need to log back in.

## 0.9.10

- CHANGED: The Enter Progress form will now default to the last measure (words, time, etc.) used when entering progress.
- CHANGED: The copy on the homepage has been improved. The screenshots now also change with color scheme and device size.
- FIXED: Navigating using the sidebar on mobile will now once again close the sidebar after navigation.
- FIXED: Stat tiles now look a bit better on mobile. No more accidental masonry effect!

## 0.9.9

- NEW: You can now add starting balances to projects to represent work on projects done before you starting tracking them in TrackBear. Starting balances will be counted anywhere that totals are represented (in the graph on the project page, for example) but do not count toward streaks or goals. (h/t murphy, wishonadarkstar)
- FIXED: The activity heatmaps will now correctly show activity on a day where you entered progress but that progress is negative or net zero (for example, if you wrote 1,000 words and then deleted 1,000 words). It still counts that you wrote, even if you end up not using it! (h/t kasperdskod007)
- CHANGED: The sidebar now indicates what page you're on. It also got a big behind-the-scenes rework and a minor facelift. Looking good, sidebar!

## 0.9.8

- NEW: You can now set your project total when entering and editing progress, as opposed to just entering the increment since last time.
- NEW: Goal stats on the dashboard now show when you've completed your habit for the current period, streaks, and if you've hit your target.
- NEW: Added a Total column to the table on the project page.
- CHANGED: Habit goal pages are now nicer to look at and feature some stats.
- FIXED: The chart on the project page will now always stay on the same tab when progress is added.

## 0.9.7

- NEW: You can now star projects and goals, which adds them to the sidebar and pulls them to the top of the list on the projects and goals pages respectively. Stats for starred goals will also show up on the Dashboard. (h/t Athena, kasperdskod007)

## 0.9.6

- CHANGED: The email verification warning is now shown on the Dashboard, in case the initial link goes to spam. (h/t cenlyra)
- FIXED: The TrackBear logo now always directs you back to the Dashboard if you're logged in, and the homepage if you're not. (h/t Etlu-Yume, kasperdskod007)
- SECURITY: Session handling is now a little cleaner.

## 0.9.5

- NEW: More behind-the-scenes improvements to help me manage TrackBear users.
- CHANGED: Based on user feedback, stats for target-based goals now count today's contributions in the running average. (h/t einhornlasagne, Elluna, River, cenlyra)

## 0.9.4

- CHANGED: The homepage now has screenshots! Now you can see what you're getting into before you sign up.

## 0.9.3

- NEW: Target-based goals now show fun stats about your progress and encouragment. (h/t einhornlasagne)
- CHANGED: The links for the About, Privacy, Changelog, and Support pages are now located under the user icon in the top right.
- FIXED: When navigating from project to project, project graphs would sometimes not display. That's now fixed.
- FIXED: There is now enough room to log hours and minutes even on very small screens (such as the Pixel 6a). (h/t einhornlasagne)

## 0.9.2

- FIXED: An extra paragraph on the About page has been removed. (h/t murphy)

## 0.9.1

- CHANGED: The heatmaps on the Dashboard and Project pages are now easier to read and more informative.

## 0.9.0

- NEW: I've added a number of behind-the-scenes features to help me manage TrackBear.
- REMOVED: All vestiges of the previous UI that were secretly hiding out have now been removed.

## 0.8.3

- NEW: We're now officially in beta! The interface and features are stable enough that (I hope) most things won't change underneath users in major ways.
- CHANGED: New theme color for a new era of TrackBear. This may not be the final color (and in fact I want to have multiple themes) but for now, enjoy the indigo.
- FIXED: Mobile styles are back! Now it should be a lot nicer to work with TrackBear on your phone.

## 0.8.0

- NEW: Goals! Set a progress target for a project or set of tags, or build a writing habit and see how long you can keep the streak going. Click on "Goals" on the sidebar to try them out.
- FIXED: Time-based projects now correctly show the total number of hours on the project list page. (h/t AngelDreamer)

## 0.7.2

- NEW: You can now edit and delete progress entries. (h/t Robot)
- NEW: You can now filter the projects list by title or description, to make finding projects in a long list easier. (h/t Athena)
- CHANGED: The project list page and sidebar now sort projects by phase.
- CHANGED: If you're on a project's page, that project will automatically populate the Enter Progress form.
- FIXED: Scrollbars no longer show up in Chrome on Windows unless they're needed. (h/t Robot, Kathryn)

## v0.7.0

- NEW: A whole new UI and backend! The new backend is much more flexible and makes it easier for me to add several requested features like tagging, streak counters, goals that span multiple projects, and habit tracking. The new UI is also much more powerful, though I'm still kicking the tires a bit. I know that there are a number of UI changes that are a step backward here, so a special apology to those of you who are primarily mobile and/or dark mode users. Stay tuned: missing functionality will come back better than ever!
- NEW: You can now add tags and notes to your progress logs.
- NEW: A Dashboard page that shows your streaks and yearly activity.
- CHANGED: Mobile support in the UI has, unfortunately, changed for the worse. I will be working on making this better.
- CHANGED: Goals have been removed from projects. However, they are still there! I have not yet implemented the UI side of goals, but your previous goals have been saved and will show up when I implement that.
- REMOVED: The light/dark theme toggle. The site will now follow the light/dark setting on your device. The new UI system makes it harder to create a light/dark theme toggle like the old UI had, so this is how it currently is. Don't worry — adding the toggle back is on the roadmap.
- REMOVED: Shared leaderboards. These will come back eventually, but the joining method needs to be thought out better.
- REMOVED: Shared projects. The ability to share will return eventually, but needs to be thought out better.
- SECURITY: I have changed and clarified some things in the [Privacy Policy](/privacy). The gist is the same, but it's more detailed now.

## v0.6.3

- CHANGED: Last bit of behind-the-scenes infra changes. This should make deployment and other changes much easier, and set the stage for the new tag-and-tally architecture.

## v0.6.1

- CHANGED: More behind-the-scenes infrastructure. No new functionality on this one!

## v0.6.0

- CHANGED: A bunch of internal infrastructure things. No new functionality on this one!

## v0.5.4

- NEW: Project pages now show your current writing streak and longest writing streak. (h/t Bäumchen)
- NEW: Project pages now show your current total. (h/t Kathryn)
- CHANGED: You can now hover over the green Par line to see where Par is for each day. (h/t cardan)

## v0.5.3

- NEW: There is now a "Resend verification link" button on the account page.

## v0.5.2

- NEW: This changelog! Keep an eye out here for recent and upcoming changes to Trackbear.

## v0.5.0

- NEW: Users will now see in-app announcements in the form of banners across the top of the screen.
- NEW: For anti-spam purposes, accounts now require email verification. New sign-ups will get an email verification immediately; existing accounts will be sent email verification in the next few days. **Accounts that do not verify their email within 10 days will be suspended.**

## v0.4.1

- NEW: You can now reset your password if you forget it.

## v0.4.0

- NEW: You can now change your password on the Account page.
- CHANGED: Signups and password changes will now cause notification/confirmation emails to be sent to the user's email address.

## v0.3.4

- NEW: You can now full-screen the graph on the project page too! (h/t Bäumchen)
- NEW: TrackBear goes mobile! Using TrackBear on your phone is a much nicer experience now. (h/t Bäumchen)
- NEW: Graphs can now display values below zero, in case you have... negative words? (h/t SyvirAshe)
- CHANGED: Graphs should generally look nicer now. :)
- FIXED: Par now starts at your daily goal for the first day, not 0. (h/t Bäumchen)
- FIXED: Time tracking on leaderboards now shows correctly on the chart. (h/t AngelDreamer)
- FIXED: The Github link in the footer now actually goes to Github. (h/t Fiona15351)
- FIXED: Graphs no longer flicker when resized or going full-screen. Huzzah! (h/t SyvirAshe)

## v0.3.0

- NEW: Leaderboards! You can now create leaderboards and others can join them. Set a goal and timeframe for everyone on the leaderboard, or let everyone set their own goals and track percentage achieved. To join a leaderboard, ask the creator for the link, and then choose the project you want to be represented on the leaderboard. Feedback welcome!
- CHANGED: Graphs now use colors from the active color scheme, instead of ChartJS's default colors.
- FIXED: Graphs now change colors when the theme is changed.

## v0.2.1

- NEW: You can now edit and delete updates.
- NEW: You can now sort the project history by any column, and your sorts will persist past refreshes.

## v0.2.0

- NEW: Project sharing! You can now set projects to "public" (they're private by default) and share a link so that others can follow that project's progress.

## v0.1.0

- NEW: Trackbear lives!
