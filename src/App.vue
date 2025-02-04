<script setup lang="ts">
import TodoList from './components/TodoList.vue'
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>
          我的待办清单
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <TodoList />
    </q-page-container>
  </q-layout>
</template>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
</style>
