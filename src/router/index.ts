import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import { useAuthStore } from '../stores/auth'
import { usePermission } from '../composables/usePermission'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true },
    },
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
          meta: { roles: ['Admin', 'Pengelola'] },
        },
        {
          path: 'master/pengguna',
          name: 'master-pengguna',
          component: () => import('../views/master/MasterPenggunaView.vue'),
          meta: { roles: ['Admin'] },
        },
        {
          path: 'master/units',
          name: 'master-units',
          component: () => import('../views/master/MasterUnitsView.vue'),
          meta: { roles: ['Admin'] },
        },
        {
          path: 'master/grup',
          name: 'master-grup',
          component: () => import('../views/master/MasterGrupView.vue'),
          meta: { roles: ['Admin'] },
        },
        {
          path: 'master/categories',
          name: 'master-categories',
          component: () => import('../views/master/MasterCategoriesView.vue'),
          meta: { roles: ['Admin'] },
        },
        {
          path: 'master/tags',
          name: 'master-tags',
          component: () => import('../views/master/MasterTagsView.vue'),
          meta: { roles: ['Admin'] },
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

// Navigation guards
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const { isAdmin, isPengelola, isPengguna } = usePermission()

  // Check authentication
  if (!to.meta.public && !authStore.isAuthenticated) {
    next('/login')
    return
  }

  // Redirect authenticated users away from login
  if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard')
    return
  }

  // Role-based access control
  const requiredRoles = to.meta.roles as string[] | undefined
  if (requiredRoles && requiredRoles.length > 0) {
    const hasAccess = requiredRoles.some(role => {
      if (role === 'Admin') return isAdmin.value
      if (role === 'Pengelola') return isPengelola.value
      if (role === 'Pengguna') return isPengguna.value
      return false
    })

    if (!hasAccess) {
      // Redirect based on role
      if (isAdmin.value) next('/dashboard')
      else if (isPengelola.value) next('/dashboard')
      else if (isPengguna.value) next('/dokumen')
      else next('/login')
      return
    }
  }

  next()
})

export default router