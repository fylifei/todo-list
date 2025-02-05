<template>
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
            :color="themeColor"
          >
            <template v-slot:append>
              <q-btn 
                round 
                :color="themeColor"
                icon="add" 
                @click="addTodo"
                :disable="!newTodo.trim()"
                class="add-btn"
                unelevated
              />
            </template>
          </q-input>
        </div>
        <div class="col-12 row q-gutter-sm">
          <div class="col">
            <div class="text-subtitle2 q-mb-sm">优先级</div>
            <q-select
              v-model="newTodoPriority"
              :options="priorityOptions"
              outlined
              class="input-field"
              :color="themeColor"
              emit-value
              map-options
              option-value="value"
              option-label="label"
              dense
              input-style="padding-top: 0; padding-bottom: 0"
              popup-content-style="padding-top: 0; padding-bottom: 0"
            >
              <template v-slot:selected-item="{ opt }">
                <q-badge
                  :color="getPriorityColor(opt.value)"
                  :text-color="getPriorityTextColor(opt.value)"
                  class="priority-badge"
                >
                  {{ opt.label }}
                </q-badge>
              </template>
            </q-select>
          </div>
          <div class="col">
            <div class="text-subtitle2 q-mb-sm">截止日期</div>
            <q-input
              v-model="newTodoDeadline"
              outlined
              class="input-field"
              :color="themeColor"
              dense
              input-style="padding-top: 0; padding-bottom: 0"
            >
              <template v-slot:prepend>
                <q-icon 
                  name="event" 
                  class="cursor-pointer"
                  style="margin-top: 0"
                >
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date
                      v-model="newTodoDeadline"
                      mask="YYYY-MM-DD"
                      minimal
                      :options="dateOptions"
                      :color="themeColor"
                    />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { type NewTodo, priorityOptions } from './types'

const props = defineProps<{
  theme: string
  themeColor: string
}>()

const emit = defineEmits<{
  (e: 'add-todo', todo: NewTodo): void
}>()

const newTodo = ref('')
const newTodoPriority = ref('medium')
const newTodoDeadline = ref(new Date().toISOString().split('T')[0])

const dateOptions = (date: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(date) >= today
}

const getPriorityColor = (priority: string) => {
  const option = priorityOptions.find(opt => opt.value === priority)
  return option ? option.color : 'grey'
}

const getPriorityTextColor = (priority: string) => {
  const option = priorityOptions.find(opt => opt.value === priority)
  return option ? option.textColor : 'white'
}

const addTodo = () => {
  const trimmedTodo = newTodo.value.trim()
  if (!trimmedTodo) return

  emit('add-todo', {
    text: trimmedTodo,
    priority: newTodoPriority.value as 'high' | 'medium' | 'low',
    deadline: newTodoDeadline.value
  })

  newTodo.value = ''
  newTodoDeadline.value = new Date().toISOString().split('T')[0]
}
</script>

<style scoped>
.input-field {
  border-radius: 12px;

  :deep(.q-field__control) {
    height: 40px;
    display: flex;
    align-items: center;
  }

  :deep(.q-field__control-container) {
    padding: 0;
    min-height: unset;
    height: 100%;
    display: flex;
    align-items: center;
  }

  :deep(.q-field__native) {
    min-height: unset;
    padding: 0 8px;
    line-height: 1;
  }

  :deep(.q-field__append),
  :deep(.q-field__prepend) {
    height: 100%;
    min-height: unset;
    padding: 0 4px;
    display: flex;
    align-items: center;
  }

  :deep(.q-icon) {
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.q-select.input-field {
  :deep(.q-field__native > span) {
    line-height: 40px;
  }
}

.priority-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
  display: inline-flex;
  align-items: center;
  height: 24px;
}

.add-btn {
  margin-left: 8px;
  margin-top: -15px !important;
}

.text-subtitle2 {
  color: rgba(0, 0, 0, 0.7);
  font-weight: 500;
  font-size: 0.875rem;
  text-align: left;
  padding-left: 2px;
}

.row.q-gutter-sm {
  margin-left: -4px;
  margin-right: -4px;
}

.row.q-gutter-sm > .col {
  padding-left: 4px;
  padding-right: 4px;
}

/* 移动端优化 */
@media (max-width: 600px) {
  .input-field {
    border-radius: 8px;
  }

  /* 调整输入框布局 */
  :deep(.q-field__control) {
    height: 40px;
    min-height: 40px;
  }

  /* 优化标题大小 */
  :deep(.text-h6) {
    font-size: 1.1rem !important;
    margin-bottom: 0.75rem !important;
  }

  /* 调整输入区域间距 */
  :deep(.row > .col-12) {
    padding: 0.25rem !important;
  }

  /* 优化日期选择器 */
  :deep(.q-date) {
    width: 100%;
    min-width: auto;
  }

  /* 调整卡片内边距 */
  :deep(.q-card__section) {
    padding: 0.75rem !important;
  }

  /* 优化按钮大小 */
  .add-btn {
    margin-left: 4px;
    width: 32px;
    height: 32px;
  }

  /* 调整下拉选择器 */
  :deep(.q-field__native > span) {
    font-size: 0.9rem;
  }

  .priority-badge {
    padding: 2px 6px;
    font-size: 0.8rem;
  }

  .text-subtitle2 {
    font-size: 0.8rem;
    margin-bottom: 0.25rem !important;
  }
}

/* 平板布局优化 */
@media (min-width: 601px) and (max-width: 1024px) {
  :deep(.row > .col-md-6) {
    padding: 0.5rem;
  }
}
</style> 