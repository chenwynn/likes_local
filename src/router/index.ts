import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/lock',
      name: 'Lock',
      component: () => import('@/views/LockView.vue'),
    },
    {
      path: '/setup',
      name: 'Setup',
      component: () => import('@/views/SetupView.vue'),
    },
    {
      path: '/',
      component: () => import('@/components/Layout/MainLayout.vue'),
      children: [
        {
          path: '',
          redirect: '/analysis',
        },
        {
          path: 'activities',
          name: 'Activities',
          component: () => import('@/views/Activities.vue'),
        },
        {
          path: 'analysis',
          name: 'Analysis',
          component: () => import('@/views/Analysis.vue'),
        },
        {
          path: 'calendar',
          name: 'Calendar',
          component: () => import('@/views/Calendar.vue'),
        },
        {
          path: 'runcourse',
          name: 'RunCourse',
          component: () => import('@/views/RunCourse.vue'),
        },
        {
          path: 'settings',
          name: 'Settings',
          component: () => import('@/views/Settings.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/analysis',
    },
  ],
})

router.beforeEach((to) => {
  const { isAuthenticated, customPassword, unlocked } = useAuth()

  if (to.path === '/lock' || to.path === '/setup') return true

  if (!isAuthenticated.value) {
    return { path: '/setup' }
  }

  if (customPassword.value && !unlocked.value) {
    return { path: '/lock', query: { redirect: to.fullPath } }
  }

  return true
})

export default router
