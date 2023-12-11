import PlaceholderPage from './components/PlaceholderPage.vue';
import LoginPage from './components/LoginPage.vue';
import ResetPasswordPage from './components/ResetPassword.vue';
import AccountPage from './components/AccountPage.vue';

import ProjectListPage from './components/ProjectListPage.vue';
import NewProjectPage from './components/NewProjectPage.vue';
import ProjectPage from './components/ProjectPage.vue';

const routes = [
  { path: '/', component: PlaceholderPage, props: { title: 'Homepage' } },
  { path: '/login', component: LoginPage },
  { path: '/reset-password/:uuid', component: ResetPasswordPage },
  { path: '/account', component: AccountPage },
  { path: '/projects', name: 'projects', component: ProjectListPage },
  { path: '/projects/new', component: NewProjectPage },
  { path: '/projects/:id', component: ProjectPage },
  { path: '/:catchAll(.*)', component: PlaceholderPage, props: { title: '404' } },
];

export default routes;
