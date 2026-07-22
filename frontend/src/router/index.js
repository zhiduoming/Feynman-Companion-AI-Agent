import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/AuthPage.vue')
  },
  {
    path: '/upload',
    name: 'Upload',
    component: () => import('@/views/UploadPage.vue')
  },
  {
    path: '/select',
    name: 'Select',
    component: () => import('@/views/SelectPage.vue')
  },
  {
    path: '/home',
    name: 'Chat',
    component: () => import('@/views/ChatView.vue')
  },
  {
    path: '/knowledge',
    name: 'Knowledge',
    component: () => import('@/views/KnowledgePage.vue')
  },
  {
    path: '/',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：检查登录状态
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('feynman_token')
  const isGuest = localStorage.getItem('feynman_guest') === 'true'
  
  // 登录页不拦截
  if (to.path === '/login') {
    next()
    return
  }
  
  // 没有token且不是游客模式，跳转登录页
  if (!token && !isGuest) {
    next('/login')
    return
  }
  
  next()
})

export default router