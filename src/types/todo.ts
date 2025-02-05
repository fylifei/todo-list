export interface Todo {
  id: number
  text: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
  deadline?: string
  completedAt?: string
}

export interface NewTodo {
  text: string
  priority: 'high' | 'medium' | 'low'
  deadline?: string
} 