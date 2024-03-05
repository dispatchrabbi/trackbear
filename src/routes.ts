import PlaceholderPage from 'src/pages/PlaceholderPage.vue';

import HomePage from 'src/pages/HomePage.vue';
import MaintenancePage from 'src/pages/MaintenancePage.vue';
import AboutPage from 'src/pages/AboutPage.vue';
import ChangelogPage from 'src/pages/ChangelogPage.vue';
import PrivacyPage from 'src/pages/PrivacyPage.vue';

import SignUpPage from 'src/pages/SignUpPage.vue';
import LoginPage from 'src/pages/LoginPage.vue';
import LogoutPage from 'src/pages/LogoutPage.vue';
import VerifyEmailPage from 'src/pages/VerifyEmailPage.vue';
import SendResetPasswordPage from 'src/pages/SendResetPasswordPage.vue';
import ResetPasswordPage from 'src/pages/ResetPasswordPage.vue';

import SharedProjectPage from 'src/pages/SharedProjectPage.vue';

import AccountPage from 'src/pages/AccountPage.vue';

import ProjectListPage from 'src/components/project/ProjectListPage.vue';
import NewProjectPage from 'src/components/project/NewProjectPage.vue';
import ProjectPage from 'src/components/project/ProjectPage.vue';
import EditProjectPage from 'src/components/project/EditProjectPage.vue';

import LeaderboardListPage from 'src/components/leaderboard/LeaderboardListPage.vue';
import LeaderboardPage from 'src/components/leaderboard/LeaderboardPage.vue';
import NewLeaderboardPage from 'src/components/leaderboard/NewLeaderboardPage.vue';
import EditLeaderboardPage from 'src/components/leaderboard/EditLeaderboardPage.vue';

import DashboardPage from 'src/pages/DashboardPage.vue';

import WorksListPage from 'src/pages/works/WorksListPage.vue';
import WorkDetailPage from './pages/works/WorkDetailPage.vue';

const routes = [
  // no login needed
  { path: '/', name: 'home', component: HomePage },
  { path: '/maintenance', name: 'maintenance', component: MaintenancePage },
  { path: '/about', name: 'about', component: AboutPage },
  { path: '/changelog', name: 'changelog', component: ChangelogPage },
  { path: '/privacy', name: 'privacy', component: PrivacyPage },
  { path: '/signup', name:'signup', component: SignUpPage },
  { path: '/login', name:'login', component: LoginPage },
  { path: '/logout', name:'logout', component: LogoutPage },
  { path: '/verify-email/:uuid', name:'verify-email', component: VerifyEmailPage },
  { path: '/reset-password/', name:'send-reset-password', component: SendResetPasswordPage },
  { path: '/reset-password/:uuid', name:'reset-password', component: ResetPasswordPage },
  { path: '/share/projects/:uuid', name:'share-project', component: SharedProjectPage },

  // Tag-and-Tally building
  { path: '/dashboard', name:'dashboard', component: DashboardPage },

  // Works section
  { path: '/works', name: 'works', component: WorksListPage },
  { path: '/works/:id', name: 'work', component: WorkDetailPage },

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
