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
