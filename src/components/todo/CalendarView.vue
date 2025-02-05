<template>
  <div class="calendar-container">
    <q-card class="calendar-card glass-card q-mb-md">
      <q-card-section class="calendar-section q-pa-none">
        <div class="calendar-wrapper">
          <q-date
            v-model="currentDate"
            mask="YYYY/MM/DD"
            today-btn
            minimal
            flat
            navigation-min-year-month="2024/01"
            navigation-max-year-month="2030/12"
            class="full-width custom-calendar"
            :events="eventDays"
            :event-color="getEventColor"
            @update:model-value="selectDateFromStr"
            :color="themeColor"
          />
        </div>
      </q-card-section>
    </q-card>

    <q-card class="task-list-card glass-card" v-if="selectedDateTodos.length > 0">
      <q-card-section>
        <div :class="['text-h6', 'text-weight-medium', `text-${theme}`, 'q-mb-md']">
          {{ formatSelectedDate }}的任务
        </div>
        <TodoList
          :todos="selectedDateTodos"
          :theme="theme"
          :theme-color="themeColor"
          @update-todo="$emit('update-todo', $event)"
          @delete-todo="$emit('delete-todo', $event)"
        />
      </q-card-section>
    </q-card>
    <q-card v-else-if="selectedDate" class="task-list-card glass-card">
      <q-card-section class="text-center q-pa-lg">
        <q-icon name="event_busy" size="50px" color="grey-5" />
        <div class="text-subtitle1 text-grey q-mt-sm">该日期没有待办事项</div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Todo } from './types'
import { priorityOptions } from './types'
import TodoList from './TodoList.vue'

const props = defineProps<{
  todos: Todo[]
  theme: string
  themeColor: string
}>()

const emit = defineEmits<{
  (e: 'update-todo', todo: Todo): void
  (e: 'delete-todo', id: number): void
}>()

const currentDate = ref(new Date().toISOString().split('T')[0])
const selectedDate = ref<string | null>(currentDate.value)

const getDayTodos = (dateStr: string) => {
  return props.todos.filter(todo => {
    if (!todo.deadline) return false
    const todoDate = new Date(todo.deadline)
    const date = new Date(dateStr)
    return todoDate.getFullYear() === date.getFullYear() &&
           todoDate.getMonth() === date.getMonth() &&
           todoDate.getDate() === date.getDate()
  })
}

const selectDateFromStr = (dateStr: string) => {
  selectedDate.value = dateStr
}

// 初始化时自动选择当天日期
onMounted(() => {
  selectDateFromStr(currentDate.value)
})

const selectedDateTodos = computed(() => {
  if (!selectedDate.value) return []
  const filteredTodos = props.todos.filter(todo => {
    if (!todo.deadline) return false
    const todoDate = new Date(todo.deadline)
    const selectedDateObj = new Date(selectedDate.value!)
    return todoDate.getFullYear() === selectedDateObj.getFullYear() &&
           todoDate.getMonth() === selectedDateObj.getMonth() &&
           todoDate.getDate() === selectedDateObj.getDate()
  })

  // 应用与列表视图相同的排序逻辑
  return filteredTodos.sort((a, b) => {
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

const formatSelectedDate = computed(() => {
  if (!selectedDate.value) return ''
  const date = new Date(selectedDate.value)
  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
})

const eventDays = computed(() => {
  const days = new Set<string>()
  props.todos.forEach(todo => {
    if (todo.deadline) {
      const date = new Date(todo.deadline)
      const formattedDate = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
      days.add(formattedDate)
    }
  })
  return Array.from(days)
})

const getEventColor = (date: string) => {
  const formattedDate = date.split('/').join('-')
  const dayTodos = getDayTodos(formattedDate)
  
  if (dayTodos.length === 0) return 'primary'
  
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const highestPriorityTodo = dayTodos.reduce((prev, curr) => {
    return priorityOrder[prev.priority] <= priorityOrder[curr.priority] ? prev : curr
  })
  
  return getPriorityColor(highestPriorityTodo.priority)
}

const getPriorityColor = (priority: string) => {
  const option = priorityOptions.find(opt => opt.value === priority)
  return option ? option.color : 'grey'
}
</script>

<style scoped>
.calendar-container {
  margin-bottom: 1.5rem;
}

.calendar-card {
  overflow: hidden;
}

.calendar-section {
  background: rgba(255, 255, 255, 0.5);
}

.custom-calendar {
  background: transparent;
}
</style> 