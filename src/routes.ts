import PlaceholderPage from './components/PlaceholderPage.vue';
import ProjectListPage from './components/ProjectListPage.vue';
import NewProjectPage from './components/NewProjectPage.vue';
import ProjectPage from './components/ProjectPage.vue';

const routes = [
  { path: '/', component: PlaceholderPage },
  { path: '/projects', name: 'projects', component: ProjectListPage },
  { path: '/projects/new', component: NewProjectPage },
  { path: '/projects/:id', component: ProjectPage },
  { path: '/:catchAll(.*)', component: PlaceholderPage },
];

export default routes;
