# CHANGELOG

This file lists notable changes to TrackBear in each version. TrackBear uses romantic versioning; all releases currently are alpha releases.

Types of changes include:
- NEW, for new features
- CHANGED, for changes in existing functionality
- FIXED, for bug fixes
- DEPRECATED, for soon-to-be-removed features
- REMOVED, for features that have been removed
- SECURITY, for vulnerabilities or other security updates

## Upcoming/Unreleased

- NEW: Target-based goals now show fun stats about your progress and encouragment. (h/t einhornlasagne)
- CHANGED: The links for the About, Privacy, Changelog, and Support pages are now located under the user icon in the top right.
- FIXED: When navigating from project to project, project graphs would sometimes not display. That's now fixed.
- FIXED: There is now enough room to log hours and minutes even on very small screens (such as the Pixel 6a). (h/t einhornlasagne)

## 0.9.2

- FIXED: An extra paragraph on the About page has been removed. (h/t murphy)

## 0.9.1

- CHANGED: The heatmaps on the Dashboard and Project pages are now easier to read and more informative.

## 0.9.0

- NEW: A number of behind-the-scenes features to help me manage TrackBear.
- REMOVED: All vestiges of the previous UI that were secretly hiding out.

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
