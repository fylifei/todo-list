<template>
  <div class="main-container" :class="`bg-${theme}`">
    <q-page class="content-wrapper q-pa-md">
      <div class="row w-100">
        <div class="col-12">
          <!-- 标题和视图切换 -->
          <div class="row items-center q-mb-lg">
            <div class="col">
              <div :class="['text-h5', 'text-weight-bold', `text-${theme}`]">我的待办事项</div>
            </div>
            <div class="col-auto">
              <q-btn
                :color="getThemeColor"
                :icon="showCalendar ? 'list' : 'calendar_month'"
                :label="showCalendar ? '列表视图' : '日历视图'"
                @click="showCalendar = !showCalendar"
                class="view-toggle-btn"
                unelevated
                size="md"
                padding="sm lg"
              >
                <q-tooltip>
                  切换到{{ showCalendar ? '列表' : '日历' }}视图
                </q-tooltip>
              </q-btn>
            </div>
          </div>

          <!-- 日历视图 -->
          <template v-if="showCalendar">
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
                      :color="getThemeColor"
                    />
                  </div>
                </q-card-section>
              </q-card>

              <q-card class="task-list-card glass-card" v-if="selectedDateTodos.length > 0">
                <q-card-section>
                  <div :class="['text-h6', 'text-weight-medium', `text-${theme}`, 'q-mb-md']">
                    {{ formatSelectedDate }}的任务
                  </div>
                  <q-list separator class="rounded-borders">
                    <q-item 
                      v-for="todo in selectedDateTodos" 
                      :key="todo.id" 
                      class="todo-item q-py-md"
                      clickable
                      v-ripple
                    >
                      <q-item-section avatar>
                        <q-checkbox 
                          v-model="todo.completed" 
                          @update:model-value="updateTodo(todo)"
                          :color="getThemeColor"
                        />
                      </q-item-section>
                      
                      <q-item-section>
                        <q-item-label :class="{ 'text-strike': todo.completed }" class="row items-center">
                          <q-badge
                            :color="getPriorityColor(todo.priority)"
                            :text-color="getPriorityTextColor(todo.priority)"
                            class="priority-badge q-mr-sm"
                          >
                            {{ priorityOptions.find(opt => opt.value === todo.priority)?.label }}
                          </q-badge>
                          <span class="task-text">{{ todo.text }}</span>
                        </q-item-label>
                        <q-item-label caption class="q-mt-xs text-left">
                          截止日期：{{ todo.deadline || '无' }}
                        </q-item-label>
                      </q-item-section>

                      <q-item-section side>
                        <q-btn
                          flat
                          round
                          dense
                          :color="getThemeColor"
                          icon="delete"
                          @click="deleteTodo(todo.id)"
                          class="delete-btn"
                        >
                          <q-tooltip>删除</q-tooltip>
                        </q-btn>
                      </q-item-section>
                    </q-item>
                  </q-list>
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

          <!-- 列表视图 -->
          <template v-else>
            <q-card class="add-task-card glass-card">
              <q-card-section class="q-pa-lg">
                <div :class="['text-h6', 'text-weight-medium', `text-${theme}`, 'q-mb-lg']">添加新任务</div>
                <div class="row">
                  <div class="col-12 q-mb-md">
                    <q-input
                      v-model="newTodo"
                      placeholder="输入任务内容"
                      @keyup.enter="addTodo"
                      outlined
                      bg-color="white"
                      class="input-field"
                      :color="getThemeColor"
                    >
                      <template v-slot:append>
                        <q-btn 
                          round 
                          :color="getThemeColor"
                          icon="add" 
                          @click="addTodo"
                          :disable="!newTodo.trim()"
                          class="add-btn"
                          unelevated
                        />
                      </template>
                    </q-input>
                  </div>
                  <div class="col-12 col-md-6 q-pr-md-sm">
                    <q-select
                      v-model="newTodoPriority"
                      :options="priorityOptions"
                      outlined
                      label="优先级"
                      class="input-field"
                      :color="getThemeColor"
                      emit-value
                      map-options
                      option-value="value"
                      option-label="label"
                    >
                      <template v-slot:selected>
                        <div class="row no-wrap items-center justify-end full-width">
                          <q-badge
                            :color="getPriorityColor(newTodoPriority)"
                            :text-color="getPriorityTextColor(newTodoPriority)"
                            class="q-px-sm"
                          >
                            {{ priorityOptions.find(opt => opt.value === newTodoPriority)?.label }}
                          </q-badge>
                        </div>
                      </template>
                    </q-select>
                  </div>
                  <div class="col-12 col-md-6 q-pl-md-sm">
                    <q-input
                      v-model="newTodoDeadline"
                      outlined
                      label="截止日期"
                      class="input-field"
                      :color="getThemeColor"
                    >
                      <template v-slot:append>
                        <q-icon name="event" class="cursor-pointer">
                          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                            <q-date
                              v-model="newTodoDeadline"
                              mask="YYYY-MM-DD"
                              minimal
                              :options="dateOptions"
                              :color="getThemeColor"
                            />
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <q-card class="task-list-card glass-card">
              <q-card-section>
                <div :class="['text-subtitle1', 'text-weight-medium', `text-${theme}`, 'q-mb-md']">任务列表</div>
                <q-list separator class="rounded-borders">
                  <q-item 
                    v-for="todo in sortedTodos" 
                    :key="todo.id" 
                    class="todo-item q-py-md"
                    clickable
                    v-ripple
                  >
                    <q-item-section avatar>
                      <q-checkbox 
                        v-model="todo.completed" 
                        @update:model-value="updateTodo(todo)"
                        :color="getThemeColor"
                      />
                    </q-item-section>
                    
                    <q-item-section>
                      <q-item-label :class="{ 'text-strike': todo.completed }" class="row items-center">
                        <q-badge
                          :color="getPriorityColor(todo.priority)"
                          :text-color="getPriorityTextColor(todo.priority)"
                          class="priority-badge q-mr-sm"
                        >
                          {{ priorityOptions.find(opt => opt.value === todo.priority)?.label }}
                        </q-badge>
                        <span class="task-text">{{ todo.text }}</span>
                      </q-item-label>
                      <q-item-label caption class="q-mt-xs text-left">
                        截止日期：{{ todo.deadline || '无' }}
                      </q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      <q-btn
                        flat
                        round
                        dense
                        :color="getThemeColor"
                        icon="delete"
                        @click="deleteTodo(todo.id)"
                        class="delete-btn"
                      >
                        <q-tooltip>删除</q-tooltip>
                      </q-btn>
                    </q-item-section>
                  </q-item>
                  
                  <!-- 空状态 -->
                  <q-item v-if="sortedTodos.length === 0" class="text-center q-py-xl">
                    <q-item-section>
                      <q-icon name="task" size="64px" color="grey-4" />
                      <div class="text-subtitle1 text-grey q-mt-sm">暂无待办事项</div>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </template>
        </div>
      </div>
    </q-page>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineProps } from 'vue'
import { useQuasar } from 'quasar'
import { date } from 'quasar'

const props = defineProps<{
  theme: string
}>()

const $q = useQuasar()

interface Todo {
  id: number
  text: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
  deadline?: string
  completedAt?: string
}

interface NewTodo {
  text: string;
  priority: 'high' | 'medium' | 'low';
  deadline: string;
}

const todos = ref<Todo[]>([])
const newTodo = ref('')
const newTodoPriority = ref('medium')
const newTodoDeadline = ref(new Date().toISOString().split('T')[0])

const priorityOptions = [
  { 
    label: '高', 
    value: 'high', 
    color: 'negative',
    textColor: 'white'
  },
  { 
    label: '中', 
    value: 'medium', 
    color: 'warning',
    textColor: 'white'
  },
  { 
    label: '低', 
    value: 'low', 
    color: 'grey-7',
    textColor: 'white'
  }
]

const dateOptions = (date: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(date) >= today
}

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

const getPriorityColor = (priority: string) => {
  const option = priorityOptions.find(opt => opt.value === priority)
  return option ? option.color : 'grey'
}

const getPriorityTextColor = (priority: string) => {
  const option = priorityOptions.find(opt => opt.value === priority)
  return option ? option.textColor : 'white'
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// 从后端加载数据
const loadTodos = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/todos`);
    if (!response.ok) throw new Error('加载数据失败');
    const data = await response.json();
    todos.value = data.map((todo: { id: number; text: string; completed: any; priority: 'high' | 'medium' | 'low'; deadline?: string }) => ({
      ...todo,
      completed: Boolean(todo.completed)
    }));
  } catch (error) {
    console.error('加载数据失败：', error);
    todos.value = [];
    $q.notify({
      type: 'negative',
      message: '加载数据失败',
      position: 'top'
    });
  }
}

// 添加待办事项
const addTodo = async () => {
  const trimmedTodo = newTodo.value.trim();
  if (!trimmedTodo) return;

  const currentDate = new Date().toISOString().split('T')[0];
  const todo: NewTodo = {
    text: trimmedTodo,
    priority: newTodoPriority.value as 'high' | 'medium' | 'low',
    deadline: newTodoDeadline.value || currentDate
  };

  try {
    const response = await fetch(`${API_BASE_URL}/todos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(todo)
    });

    if (!response.ok) throw new Error('添加失败');
    
    const result = await response.json();
    const createdTodo: Todo = {
      id: result.id,
      text: todo.text,
      completed: false,
      priority: todo.priority,
      deadline: todo.deadline
    };
    todos.value = [...todos.value, createdTodo];
    newTodo.value = '';
    newTodoDeadline.value = currentDate;

    $q.notify({
      type: 'positive',
      message: '添加成功',
      position: 'top'
    });
  } catch (error) {
    console.error('添加失败：', error);
    $q.notify({
      type: 'negative',
      message: '添加失败',
      position: 'top'
    });
  }
}

// 更新待办事项
const updateTodo = async (todo: Todo) => {
  try {
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedTodo)
    });

    if (!response.ok) throw new Error('更新失败');

    const index = todos.value.findIndex(t => t.id === updatedTodo.id);
    if (index !== -1) {
      const newTodos = [...todos.value];
      newTodos[index] = updatedTodo;
      todos.value = newTodos;
    }
  } catch (error) {
    console.error('更新失败：', error);
    $q.notify({
      type: 'negative',
      message: '更新失败',
      position: 'top'
    });
  }
}

// 删除待办事项
const deleteTodo = async (id: number) => {
  try {
    const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('删除失败');

    todos.value = todos.value.filter(todo => todo.id !== id);
    
    $q.notify({
      type: 'positive',
      message: '删除成功',
      position: 'top'
    });
  } catch (error) {
    console.error('删除失败：', error);
    $q.notify({
      type: 'negative',
      message: '删除失败',
      position: 'top'
    });
  }
}

const showCalendar = ref(false)
const currentDate = ref(new Date())

// 新增的日历相关函数
const isToday = (dateStr: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(dateStr)
  return date.getTime() === today.getTime()
}

const getDayTodos = (dateStr: string) => {
  return todos.value.filter(todo => {
    if (!todo.deadline) return false
    const todoDate = new Date(todo.deadline)
    const date = new Date(dateStr)
    return todoDate.getFullYear() === date.getFullYear() &&
           todoDate.getMonth() === date.getMonth() &&
           todoDate.getDate() === date.getDate()
  })
}

const hasEvents = (dateStr: string) => {
  return getDayTodos(dateStr).length > 0
}

const selectDateFromStr = (dateStr: string) => {
  selectedDate.value = dateStr
}

// 添加新的状态和计算属性
const selectedDate = ref<string | null>(null)

const selectDate = (day: { date: string, todos: Todo[] }) => {
  selectedDate.value = day.date
}

const selectedDateTodos = computed(() => {
  if (!selectedDate.value) return []
  return todos.value.filter(todo => {
    if (!todo.deadline) return false
    const todoDate = new Date(todo.deadline)
    const selectedDateObj = new Date(selectedDate.value!)
    return todoDate.getFullYear() === selectedDateObj.getFullYear() &&
           todoDate.getMonth() === selectedDateObj.getMonth() &&
           todoDate.getDate() === selectedDateObj.getDate()
  })
})

const formatSelectedDate = computed(() => {
  if (!selectedDate.value) return ''
  const date = new Date(selectedDate.value)
  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
})

// 获取有事件的日期
const eventDays = computed(() => {
  const days = new Set<string>()
  todos.value.forEach(todo => {
    if (todo.deadline) {
      // 确保日期格式为 YYYY/MM/DD
      const date = new Date(todo.deadline)
      const formattedDate = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
      days.add(formattedDate)
      console.log('Added event date:', formattedDate) // 调试日志
    }
  })
  const result = Array.from(days)
  console.log('Event days:', result) // 调试日志
  return result
})

// 根据任务优先级获取事件颜色
const getEventColor = (date: string) => {
  console.log('Getting color for date:', date) // 调试日志
  // 转换日期格式以匹配 todo.deadline
  const formattedDate = date.split('/').join('-')
  const dayTodos = getDayTodos(formattedDate)
  console.log('Found todos for date:', dayTodos) // 调试日志
  
  if (dayTodos.length === 0) return 'primary'
  
  // 返回最高优先级的颜色
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const highestPriorityTodo = dayTodos.reduce((prev, curr) => {
    return priorityOrder[prev.priority] <= priorityOrder[curr.priority] ? prev : curr
  })
  
  const color = getPriorityColor(highestPriorityTodo.priority)
  console.log('Returning color:', color) // 调试日志
  return color
}

// 添加主题颜色映射
const themeColorMap = {
  theme1: 'purple',
  theme2: 'blue',
  theme3: 'green'
}

// 获取主题对应的颜色
const getThemeColor = computed(() => {
  return themeColorMap[props.theme as keyof typeof themeColorMap] || 'primary'
})

// 组件挂载时加载数据
onMounted(() => {
  loadTodos()
})
</script>

<style scoped>
.main-container {
  width: 100%;
  min-height: 100vh;
}

.content-wrapper {
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  padding: 16px;
}

.glass-card {
  width: 100%;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  margin-bottom: 1rem;
  padding: 16px;
}

.calendar-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.calendar-card {
  width: 100% !important;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.calendar-section {
  width: 100% !important;
  padding: 0 !important;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.calendar-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-width: 280px;
}

.custom-calendar {
  width: 100% !important;
  min-width: 280px !important;
  max-width: none !important;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.custom-calendar :deep(.q-date) {
  width: 100% !important;
  min-width: 280px !important;
  max-width: none !important;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.custom-calendar :deep(.q-date__content) {
  width: 100% !important;
  min-width: 280px !important;
  max-width: none !important;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.custom-calendar :deep(.q-date__main) {
  width: 100% !important;
  min-width: 280px !important;
  max-width: none !important;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.custom-calendar :deep(.q-date__view) {
  width: 100% !important;
  min-width: 280px !important;
  max-width: none !important;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.custom-calendar :deep(.q-date__calendar-days) {
  width: 100% !important;
  min-width: 280px !important;
  max-width: none !important;
  display: grid !important;
  grid-template-columns: repeat(7, 1fr) !important;
  gap: 4px !important;
}

.custom-calendar :deep(.q-date__calendar-item) {
  width: 100% !important;
  min-width: unset !important;
  max-width: none !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
  aspect-ratio: 1 !important;
}

.custom-calendar :deep(.q-date__calendar-days-container) {
  width: 100% !important;
  min-width: 280px !important;
  max-width: none !important;
  display: block !important;
  padding: 8px !important;
}

.custom-calendar :deep(.q-date__header) {
  width: 100% !important;
  min-width: 280px !important;
  max-width: none !important;
}

.custom-calendar :deep(.q-date__header-navigation) {
  width: 100% !important;
  min-width: 280px !important;
  max-width: none !important;
}

.custom-calendar :deep(.q-date__calendar-weekdays) {
  width: 100% !important;
  min-width: 280px !important;
  max-width: none !important;
  display: grid !important;
  grid-template-columns: repeat(7, 1fr) !important;
}

.row {
  margin: 0 !important;
}

.col-12 {
  padding: 0 !important;
}

/* 卡片间距调整 */
.glass-card:last-child {
  margin-bottom: 0;
}

/* 主题背景色 */
.bg-theme1 {
  background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);
}

.bg-theme2 {
  background: linear-gradient(135deg, #66a6ff 0%, #89f7fe 100%);
}

.bg-theme3 {
  background: linear-gradient(135deg, #96fbc4 0%, #f9f586 100%);
}

/* 增强玻璃拟态效果 */
.glass-card {
  background: white !important;
  width: 100%;
  max-width: 100%;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
}

/* 移除通用按钮白色样式 */
.q-btn {
  /* 移除强制白色 */
}

/* 视图切换按钮保持白色 */
.view-toggle-btn {
  border-radius: 12px;
  min-width: 120px;
  font-weight: 500;
  transition: all 0.3s ease;
  color: white !important;
}

.view-toggle-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.view-toggle-btn .q-icon {
  font-size: 1.2em;
  margin-right: 4px;
}

/* 添加按钮保持白色 */
.add-btn {
  margin-left: 8px;
  color: white !important;
}

/* 删除按钮使用深色 */
.delete-btn {
  opacity: 0.7;
  transition: all 0.3s ease;
  color: rgba(0, 0, 0, 0.7) !important;
}

.delete-btn:hover {
  opacity: 1;
  color: #ff5252 !important;
}

.input-field {
  border-radius: 12px;
}

.input-field :deep(.q-field__control) {
  border-radius: 12px;
}

.priority-badge {
  border-radius: 6px;
  padding: 4px 8px;
}

.todo-item {
  transition: all 0.3s ease;
  border-radius: 8px;
  margin: 4px 0;
}

.todo-item:hover {
  background: rgba(0, 0, 0, 0.03);
}

/* 主题相关样式 */
.text-theme1 {
  color: var(--theme1-color);
}

.text-theme2 {
  color: var(--theme2-color);
}

.text-theme3 {
  color: var(--theme3-color);
}

/* 添加主题颜色类 */
:root {
  --theme1-color: #a18cd1;
  --theme2-color: #66a6ff;
  --theme3-color: #96fbc4;
}

/* 日历数字的基本样式 */
.q-date__calendar-item > div,
.q-date__calendar-item button {
  color: #000 !important;
  font-weight: 500 !important;
}

/* 选中日期的样式 */
.q-date__calendar-item--selected > div,
.q-date__calendar-item--selected button {
  color: white !important;
  font-weight: bold !important;
  background: var(--q-primary) !important;
}

/* 今天日期的样式 */
.q-date__calendar-item--today > div,
.q-date__calendar-item--today button {
  color: var(--q-primary) !important;
  font-weight: bold !important;
}

/* 禁用日期的样式 */
.q-date__calendar-item--disabled > div,
.q-date__calendar-item--disabled button {
  color: rgba(0, 0, 0, 0.38) !important;
}

/* 确保日历标题和导航可见 */
.q-date__header {
  color: #000 !important;
  background: white !important;
}

.q-date__header-link {
  color: #000 !important;
}

.q-date__header-subtitle {
  color: #000 !important;
}

/* 确保年份和月份选择器中的文字可见 */
.q-date__years-content div,
.q-date__months-content div {
  color: #000 !important;
}

/* 星期几的标题 */
.q-date__calendar-weekdays > div {
  color: #000 !important;
  font-weight: 500 !important;
}

/* 确保导航箭头可见 */
.q-date__arrow {
  color: #000 !important;
}

/* 确保今天按钮可见 */
.q-date__today {
  color: var(--q-primary) !important;
}

/* 日期选择器弹出框样式 */
.q-popup-proxy .q-date {
  background: white !important;
}

/* 移动端适配 */
@media (max-width: 599px) {
  .content-wrapper {
    padding: 12px;
  }

  .glass-card {
    padding: 12px;
    margin-bottom: 0.75rem;
  }

  .custom-calendar :deep(.q-date__calendar-item) {
    height: 32px !important;
  }

  .todo-item {
    padding: 8px !important;
  }

  .priority-badge {
    padding: 2px 6px;
    font-size: 0.8rem;
  }

  .task-text {
    font-size: 0.9rem;
  }
}

/* 平板适配 */
@media (min-width: 600px) and (max-width: 1023px) {
  .content-wrapper {
    max-width: 700px;
  }

  .glass-card {
    padding: 14px;
  }
}

/* 桌面端适配 */
@media (min-width: 1024px) {
  .content-wrapper {
    max-width: 900px;
  }

  .glass-card {
    padding: 16px;
  }

  .custom-calendar :deep(.q-date__calendar-item) {
    height: 48px !important;
  }
}
</style> 