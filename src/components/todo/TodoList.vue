<template>
  <q-list separator class="rounded-borders">
    <q-item 
      v-for="todo in todos" 
      :key="todo.id" 
      class="todo-item q-py-md"
      clickable
      v-ripple
    >
      <q-item-section avatar>
        <q-checkbox 
          v-model="todo.completed" 
          @update:model-value="$emit('update-todo', todo)"
          :color="themeColor"
        />
      </q-item-section>
      
      <q-item-section>
        <q-item-label class="row items-center">
          <div class="row items-center no-wrap">
            <q-badge
              :color="getPriorityColor(todo.priority)"
              :text-color="getPriorityTextColor(todo.priority)"
              class="priority-badge"
            >
              {{ priorityOptions.find(opt => opt.value === todo.priority)?.label }}
            </q-badge>
            <span :class="['task-text', 'q-ml-sm', { 'text-strike': todo.completed }]">{{ todo.text }}</span>
          </div>
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
          :color="themeColor"
          icon="delete"
          @click="$emit('delete-todo', todo.id)"
          class="delete-btn"
        >
          <q-tooltip>删除</q-tooltip>
        </q-btn>
      </q-item-section>
    </q-item>
    
    <!-- 空状态 -->
    <q-item v-if="todos.length === 0" class="text-center q-py-xl">
      <q-item-section>
        <q-icon name="task" size="64px" color="grey-4" />
        <div class="text-subtitle1 text-grey q-mt-sm">暂无待办事项</div>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import { type Todo, priorityOptions } from './types'

const props = defineProps<{
  todos: Todo[]
  theme: string
  themeColor: string
}>()

defineEmits<{
  (e: 'update-todo', todo: Todo): void
  (e: 'delete-todo', id: number): void
}>()

const getPriorityColor = (priority: string) => {
  const option = priorityOptions.find(opt => opt.value === priority)
  return option ? option.color : 'grey'
}

const getPriorityTextColor = (priority: string) => {
  const option = priorityOptions.find(opt => opt.value === priority)
  return option ? option.textColor : 'white'
}
</script>

<style scoped>
.todo-item {
  transition: background-color 0.2s ease;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
}

.todo-item:hover {
  background: rgba(0, 0, 0, 0.02);
}

.task-text {
  font-size: 1rem;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.85);
  word-break: break-word;
  flex: 1;
  min-width: 0;
  display: inline-block;
}

.priority-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  white-space: nowrap;
  display: inline-block;
  vertical-align: middle;
}

.delete-btn {
  opacity: 0.7;
  transition: opacity 0.2s ease;
  flex-shrink: 0;
}

.delete-btn:hover {
  opacity: 1;
}

/* 移动端优化 */
@media (max-width: 600px) {
  .todo-item {
    padding: 0.5rem;
    width: 100%;
    box-sizing: border-box;
  }

  .task-text {
    font-size: 0.9rem;
    line-height: 1.4;
    margin: 0 0.5rem;
  }

  .priority-badge {
    font-size: 0.7rem;
    padding: 0.15rem 0.35rem;
  }

  /* 优化任务内容布局 */
  :deep(.q-item__section--main) {
    min-width: 0;
    flex-shrink: 1;
    padding: 0 0.5rem;
  }

  /* 调整复选框大小 */
  :deep(.q-checkbox) {
    font-size: 1.2rem;
    margin-right: 0.5rem;
  }

  /* 优化截止日期显示 */
  :deep(.q-item__label--caption) {
    font-size: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 0.5rem;
  }

  /* 调整删除按钮 */
  :deep(.delete-btn) {
    padding: 0.25rem;
    margin-left: 0.25rem;
  }

  /* 优化空状态显示 */
  :deep(.q-item--center) {
    padding: 1.5rem 0;
    width: 100%;
  }

  /* 确保列表容器不溢出 */
  :deep(.q-list) {
    width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
  }
}
</style> 