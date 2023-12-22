import PlaceholderPage from './components/PlaceholderPage.vue';
import HomePage from './components/HomePage.vue';
import AboutPage from './components/AboutPage.vue';
import PrivacyPage from './components/PrivacyPage.vue';
import SignUpPage from './components/SignUpPage.vue';
import LoginPage from './components/LoginPage.vue';
import LogoutPage from './components/LogoutPage.vue';
import ResetPasswordPage from './components/ResetPassword.vue';
import AccountPage from './components/AccountPage.vue';

import ProjectListPage from './components/ProjectListPage.vue';
import NewProjectPage from './components/NewProjectPage.vue';
import ProjectPage from './components/ProjectPage.vue';
import EditProjectPage from './components/EditProjectPage.vue';

const routes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/about', name: 'about', component: AboutPage },
  { path: '/privacy', name: 'privacy', component: PrivacyPage },
  { path: '/signup', name:'signup', component: SignUpPage },
  { path: '/login', name:'login', component: LoginPage },
  { path: '/logout', name:'logout', component: LogoutPage },
  { path: '/reset-password/:uuid', name:'reset-password', component: ResetPasswordPage },
  { path: '/account', name: 'account', component: AccountPage },
  { path: '/projects', name: 'projects', component: ProjectListPage },
  { path: '/projects/new', name:'new-project', component: NewProjectPage },
  { path: '/projects/:id', name:'project', component: ProjectPage },
  { path: '/projects/:id/edit', name:'edit-project', component: EditProjectPage },
  { path: '/:catchAll(.*)', name:'404', component: PlaceholderPage, props: { title: '404' } },
];

export default routes;
