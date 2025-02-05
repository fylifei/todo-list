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

export interface PriorityOption {
  label: string
  value: 'high' | 'medium' | 'low'
  color: string
  textColor: string
}

export const priorityOptions: PriorityOption[] = [
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

export const themeColorMap = {
  theme1: 'purple',
  theme2: 'blue',
  theme3: 'green',
  theme4: 'orange',
  theme5: 'pink',
  theme6: 'teal',
  theme7: 'deep-purple',
  theme8: 'red-pink'
} as const 