import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import Home from './components/Home.vue'
import XiaohongshuPlugin from './components/XiaohongshuPlugin.vue'
import DouyinPlugin from './components/DouyinPlugin.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/xiaohongshu', component: XiaohongshuPlugin },
  { path: '/douyin', component: DouyinPlugin }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.use(ElementPlus)
app.mount('#app')