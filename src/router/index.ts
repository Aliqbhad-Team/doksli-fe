import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
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
          meta: { requiredRole: ['admin', 'pengelola'] },
        },
        {
          path: 'master/pengguna',
          name: 'master-pengguna',
          component: () => import('../views/master/MasterPenggunaView.vue'),
          meta: { requiredRole: ['admin', 'pengelola'] },
        },
        {
          path: 'master/unit',
          name: 'master-unit',
          component: () => import('../views/master/MasterUnitsView.vue'),
          meta: { requiredRole: 'admin' },
        },
        {
          path: 'master/grup',
          name: 'master-grup',
          component: () => import('../views/master/MasterGrupView.vue'),
          meta: { requiredRole: 'admin' },
        },
        {
          path: 'master/kategori',
          name: 'master-kategori',
          component: () => import('../views/master/MasterCategoriesView.vue'),
          meta: { requiredRole: 'admin' },
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

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)
  const requiredRole = to.matched.find(record => record.meta.requiredRole)?.meta.requiredRole as string | string[] | undefined

  if (requiresAuth && !authStore.isTokenValid()) {
    authStore.logout()
    next('/login')
  } else if (to.path === '/login' && authStore.isTokenValid()) {
    next('/dashboard')
  } else if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole.map((r: string) => r.toLowerCase()) : [String(requiredRole).toLowerCase()]
    const hasPermission = roles.includes(authStore.userRole.toLowerCase())
    if (!hasPermission) {
      next('/dashboard')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
