import type { RouteRecordRaw } from 'vue-router';

import PlaceholderPage from 'src/pages/PlaceholderPage.vue';

import HomePage from 'src/pages/HomePage.vue';
import MaintenancePage from 'src/pages/MaintenancePage.vue';
import AboutPage from 'src/pages/AboutPage.vue';
import ChangelogPage from 'src/pages/ChangelogPage.vue';
import PrivacyPage from 'src/pages/PrivacyPage.vue';
import ContactPage from 'src/pages/ContactPage.vue';
import KoFiRedirectPage from 'src/pages/KoFiRedirectPage.vue';

import SignUpPage from 'src/pages/SignUpPage.vue';
import LoginPage from 'src/pages/LoginPage.vue';
import LogoutPage from 'src/pages/LogoutPage.vue';
import VerifyEmailPage from 'src/pages/VerifyEmailPage.vue';
import SendResetPasswordPage from 'src/pages/SendResetPasswordPage.vue';
import ResetPasswordPage from 'src/pages/ResetPasswordPage.vue';

import ProfilePage from 'src/pages/public/ProfilePage.vue';
import { USERNAME_REGEX } from 'server/lib/models/user/consts.ts';
const ROUTER_PARAM_USERNAME_REGEX = USERNAME_REGEX.source.replace('^', '').replace('$', '');

import AccountPage from 'src/pages/settings/AccountPage.vue';
import SettingsPage from 'src/pages/settings/SettingsPage.vue';
import TagsPage from 'src/pages/settings/TagsPage.vue';
import ApiKeysPage from 'src/pages/settings/ApiKeysPage.vue';
import NewApiKeyPage from 'src/pages/settings/NewApiKeyPage.vue';

import AdminHomePage from 'src/pages/admin/AdminHomePage.vue';
import AdminStatsPage from 'src/pages/admin/AdminStatsPage.vue';
import AdminBannersListPage from 'src/pages/admin/BannersListPage.vue';
import AdminUsersListPage from 'src/pages/admin/UsersListPage.vue';
import AdminUserPage from 'src/pages/admin/UserPage.vue';

import DashboardPage from 'src/pages/DashboardPage.vue';

import ProjectsListPage from 'src/pages/projects/ProjectsListPage.vue';
import ProjectDetailPage from 'src/pages/projects/ProjectDetailPage.vue';
import EditProjectPage from 'src/pages/projects/EditProjectPage.vue';
import ImportProjectsPage from 'src/pages/projects/import/ImportProjectsPage.vue';
import ImportNanoManuallyPage from 'src/pages/projects/import/ImportNanoManuallyPage.vue';

import GoalsListPage from 'src/pages/goals/GoalsListPage.vue';
import NewGoalPage from 'src/pages/goals/NewGoalPage.vue';
import GoalDetailPage from 'src/pages/goals/GoalDetailPage.vue';
import EditGoalPage from 'src/pages/goals/EditGoalPage.vue';

import LeaderboardsListPage from 'src/pages/leaderboards/LeaderboardsListPage.vue';
import LeaderboardDetailPage from 'src/pages/leaderboards/LeaderboardDetailPage.vue';
import NewLeaderboardPage from 'src/pages/leaderboards/NewLeaderboardPage.vue';
import EditLeaderboardPage from 'src/pages/leaderboards/EditLeaderboardPage.vue';
import JoinLeaderboardPage from 'src/pages/leaderboards/JoinLeaderboardPage.vue';

import LifetimeStatsPage from 'src/pages/stats/LifetimeStats.vue';

const routes: RouteRecordRaw[] = [
  // Public pages (no auth required)
  { path: '/', name: 'home', component: HomePage },
  { path: '/maintenance', name: 'maintenance', component: MaintenancePage },
  { path: '/about', name: 'about', component: AboutPage },
  { path: '/changelog', name: 'changelog', component: ChangelogPage },
  { path: '/privacy', name: 'privacy', component: PrivacyPage },
  { path: '/contact', name: 'contact', component: ContactPage },
  { path: '/ko-fi', name: 'ko-fi', component: KoFiRedirectPage },

  // Auth-related
  { path: '/signup', name: 'signup', component: SignUpPage },
  { path: '/login', name: 'login', component: LoginPage },
  { path: '/logout', name: 'logout', component: LogoutPage },
  { path: '/verify-email/:verifyUuid', name: 'verify-email', component: VerifyEmailPage },
  { path: '/reset-password/', name: 'send-reset-password', component: SendResetPasswordPage },
  { path: '/reset-password/:resetUuid', name: 'reset-password', component: ResetPasswordPage },

  // Public Profile
  { path: `/:username(@${ROUTER_PARAM_USERNAME_REGEX})`, name: 'profile', component: ProfilePage },

  // Dashboard
  { path: '/dashboard', name: 'dashboard', component: DashboardPage },

  // Projects
  { path: '/projects', name: 'projects', component: ProjectsListPage },
  { path: '/projects/import', name: 'import-projects', component: ImportProjectsPage },
  { path: '/projects/import/manual-nano', name: 'import-projects-nano-manual', component: ImportNanoManuallyPage },
  { path: '/projects/:projectId(\\d+)', name: 'project', component: ProjectDetailPage },
  { path: '/projects/:projectId(\\d+)/edit', name: 'edit-projects', component: EditProjectPage },

  // Goals
  { path: '/goals', name: 'goals', component: GoalsListPage },
  { path: '/goals/new', name: 'new-goal', component: NewGoalPage },
  { path: '/goals/:goalId(\\d+)', name: 'goal', component: GoalDetailPage },
  { path: '/goals/:goalId(\\d+)/edit', name: 'edit-goal', component: EditGoalPage },

  // Leaderboards
  { path: '/leaderboards', name: 'leaderboards', component: LeaderboardsListPage },
  { path: '/leaderboards/new', name: 'new-leaderboard', component: NewLeaderboardPage },
  { path: '/leaderboards/:boardUuid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})', name: 'leaderboard', component: LeaderboardDetailPage },
  { path: '/leaderboards/:boardUuid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/edit', name: 'edit-leaderboard', component: EditLeaderboardPage },
  { path: '/leaderboards/join', name: 'join-leaderboard', component: JoinLeaderboardPage },

  // Stats
  { path: '/stats/lifetime', name: 'lifetime-stats', component: LifetimeStatsPage },

  // Account + Settings
  { path: '/account', name: 'account', component: AccountPage },
  { path: '/account/settings', name: 'settings', component: SettingsPage },
  { path: '/account/tags', name: 'tags', component: TagsPage },
  { path: '/account/api-keys', name: 'api-keys', component: ApiKeysPage },
  { path: '/account/api-keys/new', name: 'new-api-key', component: NewApiKeyPage },

  // Admin
  { path: '/admin', name: 'admin', component: AdminHomePage },
  { path: '/admin/stats', name: 'admin-stats', component: AdminStatsPage },
  { path: '/admin/banners', name: 'admin-banners', component: AdminBannersListPage },
  { path: '/admin/users', name: 'admin-users', component: AdminUsersListPage },
  { path: '/admin/users/:userId(\\d+)', name: 'admin-user', component: AdminUserPage },

  // catch-all
  { path: '/:catchAll(.*)', name: '404', component: PlaceholderPage, props: { title: '404' } },
];

export default routes;
