<template>
  <div class="todo-container">
    <div class="todo-input">
      <q-input
        v-model="newTodo"
        placeholder="添加新的待办事项"
        @keyup.enter="addTodo"
        dense
        outlined
      >
        <template v-slot:append>
          <q-btn round dense flat icon="add" @click="addTodo" />
        </template>
      </q-input>
    </div>

    <div class="todo-list">
      <q-list separator>
        <q-item v-for="todo in todos" :key="todo.id" class="todo-item">
          <q-item-section avatar>
            <q-checkbox v-model="todo.completed" @update:model-value="updateTodo(todo)" />
          </q-item-section>
          
          <q-item-section>
            <q-item-label :class="{ 'text-strike': todo.completed }">
              {{ todo.text }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-btn
              flat
              round
              dense
              color="negative"
              icon="delete"
              @click="deleteTodo(todo.id)"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <div class="todo-stats">
      <p>总计: {{ todos.length }} | 已完成: {{ completedCount }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Todo {
  id: number
  text: string
  completed: boolean
}

const todos = ref<Todo[]>([])
const newTodo = ref('')
const db = ref<IDBDatabase | null>(null)

const completedCount = computed(() => {
  return todos.value.filter(todo => todo.completed).length
})

// 初始化数据库
const initDB = () => {
  const request = indexedDB.open('TodoDB', 1)

  request.onerror = (event) => {
    console.error('数据库错误：', event)
  }

  request.onsuccess = (event) => {
    db.value = (event.target as IDBOpenDBRequest).result
    loadTodos()
  }

  request.onupgradeneeded = (event) => {
    const db = (event.target as IDBOpenDBRequest).result
    if (!db.objectStoreNames.contains('todos')) {
      db.createObjectStore('todos', { keyPath: 'id' })
    }
  }
}

// 从数据库加载待办事项
const loadTodos = () => {
  if (!db.value) return

  const transaction = db.value.transaction(['todos'], 'readonly')
  const store = transaction.objectStore('todos')
  const request = store.getAll()

  request.onsuccess = () => {
    todos.value = request.result
  }
}

// 添加待办事项
const addTodo = () => {
  if (!db.value || !newTodo.value.trim()) return

  const todo = {
    id: Date.now(),
    text: newTodo.value,
    completed: false
  }

  const transaction = db.value.transaction(['todos'], 'readwrite')
  const store = transaction.objectStore('todos')
  store.add(todo)

  transaction.oncomplete = () => {
    todos.value.push(todo)
    newTodo.value = ''
  }
}

// 更新待办事项
const updateTodo = (todo: Todo) => {
  if (!db.value) return

  const transaction = db.value.transaction(['todos'], 'readwrite')
  const store = transaction.objectStore('todos')
  const updatedTodo = {
    ...todo,
    completed: todo.completed
  }
  const request = store.put(updatedTodo)

  request.onsuccess = () => {
    const index = todos.value.findIndex(t => t.id === todo.id)
    if (index !== -1) {
      todos.value[index] = updatedTodo
    }
  }

  request.onerror = (event) => {
    console.error('更新任务状态失败：', event)
  }
}

// 删除待办事项
const deleteTodo = (id: number) => {
  if (!db.value) return

  const transaction = db.value.transaction(['todos'], 'readwrite')
  const store = transaction.objectStore('todos')
  store.delete(id)

  transaction.oncomplete = () => {
    todos.value = todos.value.filter(todo => todo.id !== id)
  }
}

// 组件挂载时初始化数据库
onMounted(() => {
  initDB()
})
</script>

<style scoped>
.todo-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.todo-input {
  margin-bottom: 20px;
}

.todo-list {
  margin-bottom: 20px;
}

.todo-item {
  transition: all 0.3s ease;
}

.todo-item:hover {
  background: rgba(0, 0, 0, 0.03);
}

.todo-stats {
  text-align: center;
  color: #666;
}

.text-strike {
  text-decoration: line-through;
  color: #999;
}
</style> 