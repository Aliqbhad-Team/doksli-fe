import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          redirect: '/dashboard'
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue'),
        },
        {
          path: 'dokumen',
          name: 'dokumen',
          component: () => import('../views/DokumenView.vue'),
        },
        {
          path: 'pencarian',
          name: 'pencarian',
          component: () => import('../views/PencarianView.vue'),
        },
        {
          path: 'audit',
          name: 'audit',
          component: () => import('../views/AuditView.vue'),
        },
        {
          path: 'master/pengguna',
          name: 'master-pengguna',
          component: () => import('../views/master/MasterPenggunaView.vue'),
        },
        {
          path: 'master/units',
          name: 'master-units',
          component: () => import('../views/master/MasterUnitsView.vue'),
        },
        {
          path: 'master/grup',
          name: 'master-grup',
          component: () => import('../views/master/MasterGrupView.vue'),
        },
        {
          path: 'master/categories',
          name: 'master-categories',
          component: () => import('../views/master/MasterCategoriesView.vue'),
        },
        {
          path: 'master/tags',
          name: 'master-tags',
          component: () => import('../views/master/MasterTagsView.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'notfound',
      component: () => import('../views/NotFoundView.vue'),
    }
  ],
})

export default router
