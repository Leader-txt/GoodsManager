<template>
  <div v-if="totalPages > 1" class="pagination">
    <button :disabled="currentPage === 1" @click="$emit('change', currentPage - 1)">上一页</button>
    <button
      v-for="page in visiblePages"
      :key="page"
      :class="{ active: page === currentPage }"
      @click="$emit('change', page)"
    >
      {{ page }}
    </button>
    <button :disabled="currentPage === totalPages" @click="$emit('change', currentPage + 1)">下一页</button>
    <span class="page-info">共 {{ total }} 条</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  currentPage: { type: Number, default: 1 },
  pageSize: { type: Number, default: 12 },
  total: { type: Number, default: 0 },
});

defineEmits(['change']);

const totalPages = computed(() => Math.ceil(props.total / props.pageSize) || 1);

const visiblePages = computed(() => {
  const pages = [];
  const max = Math.min(totalPages.value, 7);
  let start = Math.max(1, props.currentPage - 3);
  const end = Math.min(totalPages.value, start + max - 1);
  start = Math.max(1, end - max + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-top: 20px;
}
.pagination button {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  background: #fff;
  border-radius: 4px;
  color: #333;
}
.pagination button:hover:not(:disabled) { border-color: #1890ff; color: #1890ff; }
.pagination button.active { background: #1890ff; color: #fff; border-color: #1890ff; }
.pagination button:disabled { color: #ccc; cursor: not-allowed; }
.page-info { margin-left: 12px; color: #999; font-size: 13px; }
</style>
