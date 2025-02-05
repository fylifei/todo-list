<template>
  <div class="main-container" :class="`bg-${theme}`">
    <q-page class="content-wrapper">
      <div class="row">
        <div class="col-12">
          <!-- 标题和视图切换 -->
          <div class="view-toggle-container">
            <q-btn
              :color="themeColor"
              :icon="showCalendar ? 'list' : 'calendar_month'"
              :label="showCalendar ? '列表视图' : '日历视图'"
              @click="showCalendar = !showCalendar"
              class="view-toggle-btn"
              unelevated
              size="md"
            >
              <q-tooltip>
                切换到{{ showCalendar ? '列表' : '日历' }}视图
              </q-tooltip>
            </q-btn>
          </div>

          <!-- 日历视图 -->
          <CalendarView
            v-if="showCalendar"
            :todos="todos"
            :theme="theme"
            :theme-color="themeColor"
            @update-todo="updateTodo"
            @delete-todo="deleteTodo"
          />

          <!-- 列表视图 -->
          <template v-else>
            <AddTodo
              :theme="theme"
              :theme-color="themeColor"
              @add-todo="addTodo"
            />

            <q-card class="task-list-card glass-card">
              <q-card-section>
                <div :class="['text-subtitle1', 'text-weight-medium', `text-${theme}`, 'q-mb-md']">任务列表</div>
                <TodoList
                  :todos="sortedTodos"
                  :theme="theme"
                  :theme-color="themeColor"
                  @update-todo="updateTodo"
                  @delete-todo="deleteTodo"
                />
              </q-card-section>
            </q-card>
          </template>
        </div>
      </div>
    </q-page>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import type { Todo, NewTodo } from './types'
import { themeColorMap } from './types'
import AddTodo from './AddTodo.vue'
import TodoList from './TodoList.vue'
import CalendarView from './CalendarView.vue'

const props = defineProps<{
  theme: string
  username: string
}>()

const $q = useQuasar()
const todos = ref<Todo[]>([])
const showCalendar = ref(false)

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const themeColor = computed(() => {
  return themeColorMap[props.theme as keyof typeof themeColorMap] || 'primary'
})

const sortedTodos = computed(() => {
  return [...todos.value].sort((a, b) => {
    // 首先按完成状态排序
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1
    }

    // 对于未完成的任务，按优先级排序
    if (!a.completed && !b.completed) {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff

      // 然后按截止日期排序
      if (a.deadline && b.deadline) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      }
      if (a.deadline) return -1
      if (b.deadline) return 1
    }

    // 对于已完成的任务，按完成时间倒序排列
    if (a.completed && b.completed) {
      if (a.completedAt && b.completedAt) {
        return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      }
      if (a.completedAt) return -1
      if (b.completedAt) return 1
    }

    return 0
  })
})

// 从后端加载数据
const loadTodos = async () => {
  try {
    const token = localStorage.getItem('todo_token')
    if (!token) {
      throw new Error('未登录')
    }
    const response = await fetch(`${API_BASE_URL}/todos`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '加载数据失败')
    }
    const data = await response.json()
    todos.value = data.map((todo: any) => ({
      ...todo,
      completed: Boolean(todo.completed)
    }))
  } catch (error: any) {
    console.error('加载数据失败：', error)
    todos.value = []
    $q.notify({
      type: 'negative',
      message: error.message || '加载数据失败',
      position: 'top'
    })
  }
}

// 添加待办事项
const addTodo = async (newTodo: NewTodo) => {
  try {
    const token = localStorage.getItem('todo_token')
    if (!token) {
      throw new Error('未登录')
    }
    const response = await fetch(`${API_BASE_URL}/todos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newTodo)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '添加失败')
    }
    
    const result = await response.json()
    const createdTodo: Todo = {
      id: result.id,
      text: newTodo.text,
      completed: false,
      priority: newTodo.priority,
      deadline: newTodo.deadline
    }
    todos.value = [...todos.value, createdTodo]

    $q.notify({
      type: 'positive',
      message: '添加成功',
      position: 'top'
    })
  } catch (error: any) {
    console.error('添加失败：', error)
    $q.notify({
      type: 'negative',
      message: error.message || '添加失败',
      position: 'top'
    })
  }
}

// 更新待办事项
const updateTodo = async (todo: Todo) => {
  try {
    const token = localStorage.getItem('todo_token')
    // 如果任务被标记为完成，添加完成时间
    const updatedTodo = { ...todo }
    if (updatedTodo.completed && !updatedTodo.completedAt) {
      updatedTodo.completedAt = new Date().toISOString()
    } else if (!updatedTodo.completed) {
      // 如果任务被标记为未完成，清除完成时间
      updatedTodo.completedAt = undefined
    }

    const response = await fetch(`${API_BASE_URL}/todos/${updatedTodo.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatedTodo)
    })

    if (!response.ok) throw new Error('更新失败')

    const index = todos.value.findIndex(t => t.id === updatedTodo.id)
    if (index !== -1) {
      const newTodos = [...todos.value]
      newTodos[index] = updatedTodo
      todos.value = newTodos
    }
  } catch (error) {
    console.error('更新失败：', error)
    $q.notify({
      type: 'negative',
      message: '更新失败',
      position: 'top'
    })
  }
}

// 删除待办事项
const deleteTodo = async (id: number) => {
  try {
    const token = localStorage.getItem('todo_token')
    const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) throw new Error('删除失败')

    todos.value = todos.value.filter(todo => todo.id !== id)
    
    $q.notify({
      type: 'positive',
      message: '删除成功',
      position: 'top'
    })
  } catch (error) {
    console.error('删除失败：', error)
    $q.notify({
      type: 'negative',
      message: '删除失败',
      position: 'top'
    })
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadTodos()
})
</script>

<style scoped>
.main-container {
  min-height: 100vh;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.view-toggle-container {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 1000;
}

.view-toggle-btn {
  border-radius: 24px !important;
  min-width: 120px !important;
  height: 48px !important;
  font-weight: 500;
  transition: all 0.3s ease;
  color: white !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
}

.view-toggle-btn :deep(.q-btn__content) {
  flex-direction: row !important;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.view-toggle-btn :deep(.q-icon) {
  font-size: 20px;
  margin: 0;
}

.task-list-card {
  margin: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.q-card__section) {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.glass-card {
  margin-top: 1rem;
}

:deep(.q-page) {
  min-height: unset !important;
  height: auto !important;
  padding: 0 !important;
}

.row {
  flex: 1;
  margin: 0;
  width: 100%;
}

.col-12 {
  padding: 0;
  width: 100%;
}

/* 移动端优化 */
@media (max-width: 600px) {
  .main-container {
    width: 100vw;
    min-height: 100vh;
    height: 100vh;
    overflow: hidden;
    padding: 0;
  }

  .content-wrapper {
    padding: 0;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    min-height: 100vh;
    height: 100vh;
    overflow-y: auto;
  }

  .view-toggle-btn {
    min-width: 100px !important;
    height: 40px !important;
    font-size: 14px;
  }

  .view-toggle-btn :deep(.q-icon) {
    font-size: 18px;
  }

  .row {
    margin: 0 !important;
    width: 100% !important;
  }

  .col-12 {
    padding: 0 !important;
    width: 100% !important;
  }

  .glass-card {
    border-radius: 0 !important;
    margin: 0 !important;
    width: 100% !important;
    box-sizing: border-box;
  }

  /* 调整卡片内边距 */
  :deep(.q-card__section) {
    padding: 0.75rem !important;
    width: 100% !important;
    box-sizing: border-box;
  }

  /* 优化输入框布局 */
  :deep(.q-field) {
    margin-bottom: 0.5rem;
    width: 100%;
  }

  /* 调整列表项间距 */
  :deep(.q-item) {
    padding: 0.5rem;
    min-height: auto;
    width: 100%;
  }

  /* 优化按钮大小 */
  :deep(.q-btn) {
    padding: 0.25rem 0.5rem;
  }

  /* 确保所有容器都不会溢出 */
  :deep(.q-page) {
    width: 100%;
    min-width: 0;
    overflow-x: hidden;
    padding: 0 !important;
  }

  :deep(.q-layout) {
    width: 100%;
    min-width: 0;
    overflow-x: hidden;
  }

  /* 移除卡片之间的间距 */
  .task-list-card {
    margin-top: 0;
  }

  /* 优化标题样式 */
  .text-subtitle1 {
    padding: 0.5rem;
    margin: 0 !important;
    background: rgba(255, 255, 255, 0.05);
  }
}
</style> 