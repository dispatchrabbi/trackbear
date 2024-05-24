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

import AccountPage from 'src/components/pages/settings/AccountPage.vue';
import TagsPage from 'src/components/pages/settings/TagsPage.vue';

import AdminHomePage from './components/pages/admin/AdminHomePage.vue';
import AdminBannersListPage from './components/pages/admin/BannersListPage.vue';
import AdminUsersListPage from './components/pages/admin/UsersListPage.vue';
import AdminUserPage from './components/pages/admin/UserPage.vue';

import DashboardPage from 'src/components/pages/DashboardPage.vue';

import WorksListPage from 'src/components/pages/works/WorksListPage.vue';
import WorkDetailPage from 'src/components/pages/works/WorkDetailPage.vue';

import GoalsListPage from './components/pages/goals/GoalsListPage.vue';
import NewGoalPage from './components/pages/goals/NewGoalPage.vue';
import GoalDetailPage from './components/pages/goals/GoalDetailPage.vue';
import EditGoalPage from './components/pages/goals/EditGoalPage.vue';

import BoardsListPage from 'src/components/pages/boards/BoardsListPage.vue';
import BoardDetailPage from 'src/components/pages/boards/BoardDetailPage.vue';
import NewBoardPage from './components/pages/boards/NewBoardPage.vue';
import EditBoardPage from './components/pages/boards/EditBoardPage.vue';
import EditBoardParticipationPage from './components/pages/boards/EditBoardParticipationPage.vue';

const routes = [
  // no login needed
  { path: '/', name: 'home', component: HomePage },
  { path: '/maintenance', name: 'maintenance', component: MaintenancePage },
  { path: '/about', name: 'about', component: AboutPage },
  { path: '/changelog', name: 'changelog', component: ChangelogPage },
  { path: '/privacy', name: 'privacy', component: PrivacyPage },
  { path: '/contact', name: 'contact', component: ContactPage },
  { path: '/ko-fi', name: 'ko-fi', component: KoFiRedirectPage },

  { path: '/signup', name:'signup', component: SignUpPage },
  { path: '/login', name:'login', component: LoginPage },
  { path: '/logout', name:'logout', component: LogoutPage },
  { path: '/verify-email/:uuid', name:'verify-email', component: VerifyEmailPage },
  { path: '/reset-password/', name:'send-reset-password', component: SendResetPasswordPage },
  { path: '/reset-password/:uuid', name:'reset-password', component: ResetPasswordPage },

  // Tag-and-Tally building
  { path: '/dashboard', name:'dashboard', component: DashboardPage },

  // Works section
  { path: '/works', name: 'works', component: WorksListPage },
  { path: '/works/:id', name: 'work', component: WorkDetailPage },

  // Goals section
  { path: '/goals', name: 'goals', component: GoalsListPage },
  { path: '/goals/new', name: 'new-goal', component: NewGoalPage },
  { path: '/goals/:id', name: 'goal', component: GoalDetailPage },
  { path: '/goals/:id/edit', name: 'edit-goal', component: EditGoalPage },

  // Boards section
  { path: '/boards', name: 'boards', component: BoardsListPage },
  { path: '/boards/new', name: 'new-board', component: NewBoardPage },
  { path: '/boards/:uuid', name: 'board', component: BoardDetailPage },
  { path: '/boards/:uuid/edit', name: 'edit-board', component: EditBoardPage },
  { path: '/boards/:uuid/participation', name: 'join-board', component: EditBoardParticipationPage },

  // Account section
  { path: '/settings/account', name: 'account', component: AccountPage },
  { path: '/settings/tags', name: 'tags', component: TagsPage },

  // Admin section
  { path: '/admin', name: 'admin', component: AdminHomePage },
  { path: '/admin/banners', name: 'admin-banners', component: AdminBannersListPage },
  { path: '/admin/users', name: 'admin-users', component: AdminUsersListPage },
  { path: '/admin/users/:id', name: 'admin-user', component: AdminUserPage },

  // catch-all
  { path: '/:catchAll(.*)', name:'404', component: PlaceholderPage, props: { title: '404' } },
];

export default routes;
