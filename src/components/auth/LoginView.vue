<template>
  <div class="login-container">
    <q-card class="login-card glass-card">
      <q-card-section class="text-center q-pt-lg">
        <div class="text-h5 text-weight-bold q-mb-md">欢迎使用待办清单</div>
        <div class="text-subtitle1 text-grey-7">{{ isRegister ? '创建新账号' : (isSetupName ? '设置您的名字' : '请登录您的账号') }}</div>
      </q-card-section>

      <form @submit.prevent="handleAction">
        <q-card-section class="q-px-lg">
          <template v-if="!isSetupName">
            <q-input
              v-model="account"
              outlined
              label="账号"
              name="username"
              autocomplete="username"
              :rules="[val => !!val || '请输入账号']"
              class="q-mb-md"
              @keyup.enter.passive="handleAction"
            >
              <template v-slot:prepend>
                <q-icon name="account_circle" />
              </template>
            </q-input>

            <q-input
              v-model="password"
              outlined
              :type="showPassword ? 'text' : 'password'"
              label="密码"
              name="current-password"
              autocomplete="current-password"
              :rules="[val => !!val || '请输入密码']"
              class="q-mb-md"
              @keyup.enter.passive="handleAction"
            >
              <template v-slot:prepend>
                <q-icon name="lock" />
              </template>
              <template v-slot:append>
                <q-icon
                  :name="showPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>
          </template>

          <template v-if="isRegister || isSetupName">
            <q-input
              v-model="username"
              outlined
              label="您的名字"
              name="name"
              autocomplete="name"
              :rules="[val => !!val || '请输入名字']"
              class="q-mb-md"
              @keyup.enter.passive="handleAction"
            >
              <template v-slot:prepend>
                <q-icon name="person" />
              </template>
            </q-input>
          </template>

          <q-btn
            type="submit"
            :loading="loading"
            color="primary"
            class="full-width q-mb-md"
            :label="isRegister ? '注册' : (isSetupName ? '确认' : '登录')"
            :disable="!canProceed"
          >
            <template v-slot:loading>
              <q-spinner-dots />
            </template>
          </q-btn>

          <q-btn
            v-if="!isSetupName"
            flat
            color="primary"
            class="full-width"
            :label="isRegister ? '返回登录' : '创建新账号'"
            @click="isRegister = !isRegister"
          />
        </q-card-section>
      </form>

      <q-card-section class="text-center text-grey-7 q-pt-none">
        您的数据将安全保存在服务器
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'

const emit = defineEmits<{
  (e: 'login', userInfo: { account: string; username: string; token: string }): void
}>()

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const $q = useQuasar()
const account = ref('')
const password = ref('')
const username = ref('')
const loading = ref(false)
const showPassword = ref(false)
const isRegister = ref(false)
const isSetupName = ref(false)

const handleAction = async () => {
  if (!canProceed.value) return

  loading.value = true
  try {
    if (isRegister.value) {
      // 注册流程
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account: account.value,
          password: password.value,
          username: username.value
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '注册失败')
      }

      const data = await response.json()
      emit('login', {
        account: data.user.account,
        username: data.user.username,
        token: data.token
      })

      $q.notify({
        type: 'positive',
        message: '注册成功，欢迎使用',
        position: 'top'
      })
    } else if (isSetupName.value) {
      // 更新用户名
      const response = await fetch(`${API_BASE_URL}/users/username`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('todo_token')}`
        },
        body: JSON.stringify({ username: username.value })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '更新失败')
      }

      const data = await response.json()
      emit('login', {
        account: account.value,
        username: data.username,
        token: data.token
      })
    } else {
      // 登录流程
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account: account.value,
          password: password.value
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '登录失败')
      }

      const data = await response.json()
      emit('login', {
        account: data.user.account,
        username: data.user.username,
        token: data.token
      })

      $q.notify({
        type: 'positive',
        message: '欢迎回来，' + data.user.username,
        position: 'top'
      })
    }
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.message || '操作失败，请重试',
      position: 'top'
    })
  } finally {
    loading.value = false
  }
}

// 监听输入值变化
watch([account, password], ([newAccount, newPassword]) => {
  console.log('输入值变化:', {
    account: newAccount,
    password: newPassword,
    canProceed: canProceed.value
  })
})

const canProceed = computed(() => {
  const values = {
    isRegister: isRegister.value,
    isSetupName: isSetupName.value,
    account: account.value.trim(),
    password: password.value.trim(),
    username: username.value.trim()
  }
  
  console.log('登录状态检查:', values)

  if (values.isRegister) {
    return values.account && values.password && values.username
  }
  if (values.isSetupName) {
    return values.username
  }
  return values.account && values.password
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: linear-gradient(135deg, #7F7FD5 0%, #91EAE4 100%);
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.login-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.q-card {
  border-radius: 16px;
}

/* 输入框样式 */
:deep(.q-field--outlined .q-field__control) {
  border-radius: 8px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

:deep(.q-field--outlined .q-field__control:hover) {
  border-color: #7F7FD5;
}

:deep(.q-field--focused .q-field__control) {
  border-color: #7F7FD5 !important;
}

/* 按钮样式 */
:deep(.q-btn) {
  border-radius: 8px;
  height: 44px;
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

:deep(.q-btn--standard) {
  background: linear-gradient(135deg, #7F7FD5 0%, #91EAE4 100%) !important;
  color: white !important;
}

:deep(.q-btn--standard:hover) {
  opacity: 0.9;
  transform: translateY(-1px);
}

:deep(.q-btn--flat) {
  color: #7F7FD5 !important;
}

:deep(.q-btn--flat:hover) {
  background: rgba(127, 127, 213, 0.1) !important;
}

/* 图标颜色 */
:deep(.q-icon) {
  color: #7F7FD5;
}

/* 标题样式 */
.text-h5 {
  color: #2c3e50;
  font-weight: 600;
}

/* 移动端优化 */
@media (max-width: 600px) {
  .login-container {
    padding: 1rem;
  }

  .login-card {
    margin: 0;
    padding: 1rem;
  }

  :deep(.q-btn) {
    height: 40px;
  }
}
</style> 