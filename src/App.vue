<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import MainTodoList from './components/todo/MainTodoList.vue'
import LoginView from './components/auth/LoginView.vue'

const $q = useQuasar()
const isLoggedIn = ref(false)
const currentTheme = ref('theme1')
const userInfo = ref({
  account: '',
  username: '',
  token: ''
})

const themes = [
  {
    id: 'theme1',
    name: '梦幻紫',
    gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)'
  },
  {
    id: 'theme2',
    name: '海洋蓝',
    gradient: 'linear-gradient(135deg, #66a6ff 0%, #89f7fe 100%)'
  },
  {
    id: 'theme3',
    name: '春日绿',
    gradient: 'linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)'
  },
  {
    id: 'theme4',
    name: '夕阳橙',
    gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)'
  },
  {
    id: 'theme5',
    name: '玫瑰红',
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)'
  },
  {
    id: 'theme6',
    name: '薄荷青',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  },
  {
    id: 'theme7',
    name: '极光紫',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    id: 'theme8',
    name: '珊瑚粉',
    gradient: 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)'
  }
]

const setTheme = (theme: string) => {
  currentTheme.value = theme
  localStorage.setItem('todo_theme', theme)
}

const handleLogin = (info: { account: string; username: string; token: string }) => {
  userInfo.value = info
  localStorage.setItem('todo_token', info.token)
  localStorage.setItem('todo_user_info', JSON.stringify(info))
  isLoggedIn.value = true
}

const handleLogout = () => {
  isLoggedIn.value = false
  userInfo.value = {
    account: '',
    username: '',
    token: ''
  }
  localStorage.removeItem('todo_token')
  localStorage.removeItem('todo_user_info')
  $q.notify({
    type: 'info',
    message: '已退出登录',
    position: 'top'
  })
}

onMounted(() => {
  // 恢复主题设置
  const savedTheme = localStorage.getItem('todo_theme')
  if (savedTheme) {
    currentTheme.value = savedTheme
  }

  // 检查登录状态
  const token = localStorage.getItem('todo_token')
  const savedUserInfo = localStorage.getItem('todo_user_info')
  if (token && savedUserInfo) {
    try {
      userInfo.value = JSON.parse(savedUserInfo)
      isLoggedIn.value = true
    } catch (error) {
      console.error('Failed to parse user info:', error)
      handleLogout()
    }
  }
})
</script>

<template>
  <div id="app" :class="currentTheme">
    <template v-if="isLoggedIn">
      <q-layout view="hHh lpR fFf">
        <q-header elevated class="bg-primary text-white">
          <q-toolbar>
            <q-toolbar-title>
              {{ userInfo.username }}的待办清单
            </q-toolbar-title>

            <q-btn-dropdown flat label="主题">
              <q-list>
                <q-item v-for="theme in themes" :key="theme.id" clickable v-close-popup @click="setTheme(theme.id)">
                  <q-item-section>
                    <q-item-label>{{ theme.name }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>

            <q-btn flat @click="handleLogout">
              退出登录
              <q-icon name="logout" class="q-ml-sm" />
            </q-btn>
          </q-toolbar>
        </q-header>

        <q-page-container>
          <MainTodoList :username="userInfo.username" :theme="currentTheme" />
        </q-page-container>
      </q-layout>
    </template>
    <template v-else>
      <LoginView @login="handleLogin" />
    </template>
  </div>
</template>

<style>
#app {
  width: 100%;
  min-height: 100vh;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background: #f5f5f5;
  width: 100%;
  min-height: 100vh;
  height: 100vh;
  overflow-x: hidden;
}

:deep(.q-layout) {
  min-height: 100vh !important;
  height: 100vh !important;
}

:deep(.q-page-container) {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.header {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header.theme1 {
  background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);
}

.header.theme2 {
  background: linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%);
}

.header.theme3 {
  background: linear-gradient(135deg, #96fbc4 0%, #f9f586 100%);
}

.header-toolbar {
  background: rgba(255, 255, 255, 0.1);
}

.header-title {
  font-weight: 600;
  letter-spacing: 0.5px;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-container {
  background: #f8f9fa;
  min-height: 100vh;
}

.theme-preview {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* 全局卡片样式 */
.glass-card {
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08) !important;
}

/* 主题背景色 */
.bg-theme1 {
  background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);
  --theme-color: var(--q-purple);
}

.bg-theme2 {
  background: linear-gradient(135deg, #66a6ff 0%, #89f7fe 100%);
  --theme-color: var(--q-blue);
}

.bg-theme3 {
  background: linear-gradient(135deg, #96fbc4 0%, #f9f586 100%);
  --theme-color: var(--q-green);
}

.bg-theme4 {
  background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
  --theme-color: var(--q-orange);
}

.bg-theme5 {
  background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%);
  --theme-color: var(--q-pink);
}

.bg-theme6 {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  --theme-color: var(--q-mint);
}

.bg-theme7 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --theme-color: var(--q-violet);
}

.bg-theme8 {
  background: linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%);
  --theme-color: var(--q-coral);
}

/* 主题文字颜色 */
.text-theme1 {
  color: var(--q-purple);
}

.text-theme2 {
  color: var(--q-blue);
}

.text-theme3 {
  color: var(--q-green);
}

.text-theme4 {
  color: var(--q-orange);
}

.text-theme5 {
  color: var(--q-pink);
}

.text-theme6 {
  color: var(--q-mint);
}

.text-theme7 {
  color: var(--q-violet);
}

.text-theme8 {
  color: var(--q-coral);
}

:root {
  --q-purple: #a18cd1;
  --q-blue: #66a6ff;
  --q-green: #96fbc4;
  --q-orange: #f6d365;
  --q-pink: #ff9a9e;
  --q-mint: #43e97b;
  --q-violet: #667eea;
  --q-coral: #ff758c;
}

/* 移动端优化 */
@media (max-width: 600px) {
  .q-layout {
    width: 100vw !important;
    min-width: 100vw !important;
    max-width: 100vw !important;
    overflow-x: hidden !important;
    min-height: 100vh !important;
    height: 100vh !important;
  }

  .q-page-container {
    padding: 0 !important;
    width: 100% !important;
    overflow-x: hidden !important;
    min-height: 100vh !important;
    height: 100vh !important;
  }

  .q-header {
    width: 100% !important;
  }
}

/* 添加登录相关样式 */
.q-toolbar {
  display: flex;
  justify-content: space-between;
}

.q-toolbar-title {
  flex: 1;
  text-align: center;
}
</style>
