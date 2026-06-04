import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useProductStore = defineStore('product', () => {
  const list = ref([]);
  const total = ref(0);
  const currentPage = ref(1);
  const pageSize = ref(12);
  const filters = ref({
    keyword: '',
    category: '',
    brand: '',
    sort: 'default',
  });

  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters };
    currentPage.value = 1;
  }

  function resetFilters() {
    filters.value = { keyword: '', category: '', brand: '', sort: 'default' };
    currentPage.value = 1;
  }

  return { list, total, currentPage, pageSize, filters, setFilters, resetFilters };
});
