import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: Dashboard
  },
  {
    path: '/queue',
    name: 'claims-queue',
    component: () => import('../views/ClaimsQueue.vue')
  },
  {
    path: '/claim/:id',
    name: 'claim-details',
    component: () => import('../views/ClaimDetails.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router