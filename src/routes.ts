import PlaceholderPage from './components/PlaceholderPage.vue';

import HomePage from './components/HomePage.vue';
import AboutPage from './components/AboutPage.vue';
import PrivacyPage from './components/PrivacyPage.vue';
import SignUpPage from './components/SignUpPage.vue';
import LoginPage from './components/LoginPage.vue';
import LogoutPage from './components/LogoutPage.vue';
import SendResetPasswordPage from './components/SendResetPassword.vue';
import ResetPasswordPage from './components/ResetPassword.vue';
import SharedProjectPage from './components/SharedProjectPage.vue';

import AccountPage from './components/AccountPage.vue';

import ProjectListPage from './components/project/ProjectListPage.vue';
import NewProjectPage from './components/project/NewProjectPage.vue';
import ProjectPage from './components/project/ProjectPage.vue';
import EditProjectPage from './components/project/EditProjectPage.vue';

import LeaderboardListPage from './components/leaderboard/LeaderboardListPage.vue';
import LeaderboardPage from './components/leaderboard/LeaderboardPage.vue';
import NewLeaderboardPage from './components/leaderboard/NewLeaderboardPage.vue';
import EditLeaderboardPage from './components/leaderboard/EditLeaderboardPage.vue';

const routes = [
  // no login needed
  { path: '/', name: 'home', component: HomePage },
  { path: '/about', name: 'about', component: AboutPage },
  { path: '/privacy', name: 'privacy', component: PrivacyPage },
  { path: '/signup', name:'signup', component: SignUpPage },
  { path: '/login', name:'login', component: LoginPage },
  { path: '/logout', name:'logout', component: LogoutPage },
  { path: '/reset-password/', name:'send-reset-password', component: SendResetPasswordPage },
  { path: '/reset-password/:uuid', name:'reset-password', component: ResetPasswordPage },
  { path: '/share/projects/:uuid', name:'share-project', component: SharedProjectPage },

  // account section
  { path: '/account', name: 'account', component: AccountPage },

  // projects section
  { path: '/projects', name: 'projects', component: ProjectListPage },
  { path: '/projects/new', name:'new-project', component: NewProjectPage },
  { path: '/projects/:id', name:'project', component: ProjectPage },
  { path: '/projects/:id/edit', name:'edit-project', component: EditProjectPage },

  // leaderboard section
  { path: '/leaderboards', name: 'leaderboards', component: LeaderboardListPage },
  { path: '/leaderboards/new', name:'new-leaderboard', component: NewLeaderboardPage },
  { path: '/leaderboards/:uuid', name: 'leaderboard', component: LeaderboardPage },
  { path: '/leaderboards/:uuid/edit', name:'edit-leaderboard', component: EditLeaderboardPage },

  // catch-all
  { path: '/:catchAll(.*)', name:'404', component: PlaceholderPage, props: { title: '404' } },
];

export default routes;
