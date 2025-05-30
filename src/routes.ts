import PlaceholderPage from 'src/components/pages/PlaceholderPage.vue';

import HomePage from 'src/components/pages/HomePage.vue';
import MaintenancePage from 'src/components/pages/MaintenancePage.vue';
import AboutPage from 'src/components/pages/AboutPage.vue';
import ChangelogPage from 'src/components/pages/ChangelogPage.vue';
import PrivacyPage from 'src/components/pages/PrivacyPage.vue';
import ContactPage from 'src/components/pages/ContactPage.vue';
import KoFiRedirectPage from 'src/components/pages/KoFiRedirectPage.vue';

import SignUpPage from 'src/components/pages/SignUpPage.vue';
import LoginPage from 'src/components/pages/LoginPage.vue';
import LogoutPage from 'src/components/pages/LogoutPage.vue';
import VerifyEmailPage from 'src/components/pages/VerifyEmailPage.vue';
import SendResetPasswordPage from 'src/components/pages/SendResetPasswordPage.vue';
import ResetPasswordPage from 'src/components/pages/ResetPasswordPage.vue';

import ProfilePage from 'src/components/pages/public/ProfilePage.vue';
import { USERNAME_REGEX } from 'server/lib/models/user/consts.ts';
const ROUTER_PARAM_USERNAME_REGEX = USERNAME_REGEX.source.replace('^', '').replace('$', '');

import SettingsPage from './components/pages/settings/SettingsPage.vue';
import AccountPage from 'src/components/pages/settings/AccountPage.vue';
import TagsPage from 'src/components/pages/settings/TagsPage.vue';

import AdminHomePage from './components/pages/admin/AdminHomePage.vue';
import AdminStatsPage from './components/pages/admin/AdminStatsPage.vue';
import AdminBannersListPage from './components/pages/admin/BannersListPage.vue';
import AdminUsersListPage from './components/pages/admin/UsersListPage.vue';
import AdminUserPage from './components/pages/admin/UserPage.vue';

import DashboardPage from 'src/components/pages/DashboardPage.vue';

import WorksListPage from 'src/components/pages/works/WorksListPage.vue';
import WorkDetailPage from 'src/components/pages/works/WorkDetailPage.vue';
import EditWorkPage from './components/pages/works/EditWorkPage.vue';
import WorksImportPage from 'src/components/pages/works/import/WorksImportPage.vue';
import WorksImportNanoAutoPage from './components/pages/works/import/WorksImportNanoAutoPage.vue';
import WorksImportNanoManualPage from './components/pages/works/import/WorksImportNanoManualPage.vue';
import WorksImportYwpAutoPage from './components/pages/works/import/WorksImportYwpAutoPage.vue';

import GoalsListPage from './components/pages/goals/GoalsListPage.vue';
import NewGoalPage from './components/pages/goals/NewGoalPage.vue';
import GoalDetailPage from './components/pages/goals/GoalDetailPage.vue';
import EditGoalPage from './components/pages/goals/EditGoalPage.vue';

import LeaderboardsListPage from 'src/components/pages/leaderboards/LeaderboardsListPage.vue';
import LeaderboardDetailPage from 'src/components/pages/leaderboards/LeaderboardDetailPage.vue';
import NewLeaderboardPage from './components/pages/leaderboards/NewLeaderboardPage.vue';
import EditLeaderboardPage from './components/pages/leaderboards/EditLeaderboardPage.vue';
import JoinLeaderboardPage from './components/pages/leaderboards/JoinLeaderboardPage.vue';

import LifetimeStatsPage from './components/pages/stats/LifetimeStats.vue';

const routes = [
  // no login needed
  { path: '/', name: 'home', component: HomePage },
  { path: '/maintenance', name: 'maintenance', component: MaintenancePage },
  { path: '/about', name: 'about', component: AboutPage },
  { path: '/changelog', name: 'changelog', component: ChangelogPage },
  { path: '/privacy', name: 'privacy', component: PrivacyPage },
  { path: '/contact', name: 'contact', component: ContactPage },
  { path: '/ko-fi', name: 'ko-fi', component: KoFiRedirectPage },

  { path: '/signup', name: 'signup', component: SignUpPage },
  { path: '/login', name: 'login', component: LoginPage },
  { path: '/logout', name: 'logout', component: LogoutPage },
  { path: '/verify-email/:verifyUuid', name: 'verify-email', component: VerifyEmailPage },
  { path: '/reset-password/', name: 'send-reset-password', component: SendResetPasswordPage },
  { path: '/reset-password/:resetUuid', name: 'reset-password', component: ResetPasswordPage },

  { path: `/:username(@${ROUTER_PARAM_USERNAME_REGEX})`, name: 'profile', component: ProfilePage },

  // Tag-and-Tally building
  { path: '/dashboard', name: 'dashboard', component: DashboardPage },

  // Works section
  { path: '/works', name: 'works', component: WorksListPage },
  { path: '/works/import', name: 'import-works', component: WorksImportPage },
  { path: '/works/import/auto-nano', name: 'import-works-nano-auto', component: WorksImportNanoAutoPage },
  { path: '/works/import/auto-ywp', name: 'import-works-ywp-auto', component: WorksImportYwpAutoPage },
  { path: '/works/import/manual-nano', name: 'import-works-nano-manual', component: WorksImportNanoManualPage },
  { path: '/works/:workId(\\d+)', name: 'work', component: WorkDetailPage },
  { path: '/works/:workId(\\d+)/edit', name: 'edit-work', component: EditWorkPage },

  // Goals section
  { path: '/goals', name: 'goals', component: GoalsListPage },
  { path: '/goals/new', name: 'new-goal', component: NewGoalPage },
  { path: '/goals/:goalId(\\d+)', name: 'goal', component: GoalDetailPage },
  { path: '/goals/:goalId(\\d+)/edit', name: 'edit-goal', component: EditGoalPage },

  // Leaderboards section
  { path: '/leaderboards', name: 'leaderboards', component: LeaderboardsListPage },
  { path: '/leaderboards/new', name: 'new-leaderboard', component: NewLeaderboardPage },
  { path: '/leaderboards/:boardUuid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})', name: 'leaderboard', component: LeaderboardDetailPage },
  { path: '/leaderboards/:boardUuid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/edit', name: 'edit-leaderboard', component: EditLeaderboardPage },
  { path: '/leaderboards/join', name: 'join-leaderboard', component: JoinLeaderboardPage },

  // Stats section
  { path: '/stats/lifetime', name: 'lifetime-stats', component: LifetimeStatsPage },

  // Account section
  { path: '/account', name: 'account', component: AccountPage },
  { path: '/account/settings', name: 'settings', component: SettingsPage },
  { path: '/account/tags', name: 'tags', component: TagsPage },

  // Admin section
  { path: '/admin', name: 'admin', component: AdminHomePage },
  { path: '/admin/stats', name: 'admin-stats', component: AdminStatsPage },
  { path: '/admin/banners', name: 'admin-banners', component: AdminBannersListPage },
  { path: '/admin/users', name: 'admin-users', component: AdminUsersListPage },
  { path: '/admin/users/:userId(\\d+)', name: 'admin-user', component: AdminUserPage },

  // catch-all
  { path: '/:catchAll(.*)', name: '404', component: PlaceholderPage, props: { title: '404' } },
];

export default routes;
