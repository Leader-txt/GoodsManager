<template>
  <div class="inventory-page">
    <div class="page-header">
      <h2>库存总览</h2>
      <div class="header-actions">
        <router-link to="/warehouse/stock-in" class="btn-action">入库</router-link>
        <router-link to="/warehouse/stock-out" class="btn-action btn-out">出库</router-link>
      </div>
    </div>

    <div class="filter-bar">
      <input v-model="keyword" @keyup.enter="search" type="text" placeholder="搜索商品名称/编号..." class="filter-input" />
      <select v-model="categoryFilter" @change="search">
        <option value="">全部类型</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
      <select v-model="stockStatus" @change="search">
        <option value="">全部库存</option>
        <option value="in_stock">有货</option>
        <option value="out_of_stock">缺货</option>
        <option value="low_stock">低库存(&lt;5)</option>
      </select>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else>
      <table class="data-table">
        <thead>
          <tr><th>ID</th><th>商品名称</th><th>类型</th><th>货架</th><th>库存</th><th>更新时间</th><th>操作</th></tr>
        </thead>
        <tbody>
          <tr v-for="item in inventory" :key="item.id" :class="{ 'row-warn': item.quantity > 0 && item.quantity < 5, 'row-danger': item.quantity === 0 }">
            <td>{{ item.product_id }}</td>
            <td>{{ item.product_name }}</td>
            <td>{{ item.category }}</td>
            <td>{{ item.shelf_code || '未分配' }}</td>
            <td :class="{ 'qty-low': item.quantity > 0 && item.quantity < 5, 'qty-zero': item.quantity === 0 }">{{ item.quantity }}</td>
            <td>{{ formatDate(item.updated_at) }}</td>
            <td>
              <router-link :to="`/warehouse/inventory/${item.product_id}`" class="link">详情</router-link>
            </td>
          </tr>
        </tbody>
      </table>
      <Pagination :currentPage="page" :pageSize="pageSize" :total="total" @change="p => { page = p; fetchInventory(); }" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getInventory } from '@/api/inventory';
import { getCategories } from '@/api/product';
import Pagination from '@/components/common/Pagination.vue';
import { formatDate } from '@/utils/format';

const inventory = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const keyword = ref('');
const categoryFilter = ref('');
const stockStatus = ref('');
const categories = ref([]);

async function fetchInventory() {
  loading.value = true;
  try {
    const params = { page: page.value, pageSize: pageSize.value, keyword: keyword.value, category: categoryFilter.value, stockStatus: stockStatus.value };
    const res = await getInventory(params);
    if (res.code === 200) {
      inventory.value = res.data.list;
      total.value = res.data.total;
    }
  } finally { loading.value = false; }
}

function search() { page.value = 1; fetchInventory(); }

onMounted(async () => {
  try {
    const res = await getCategories();
    if (res.code === 200) categories.value = res.data;
  } catch { /* ignore */ }
  fetchInventory();
});
</script>

<style scoped>
.inventory-page { max-width: 1100px; margin: 0 auto; padding: 24px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h2 { margin: 0; }
.header-actions { display: flex; gap: 8px; }
.btn-action { padding: 8px 18px; background: #1890ff; color: #fff; border-radius: 4px; font-size: 14px; text-decoration: none; }
.btn-out { background: #52c41a; }
.filter-bar { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.filter-input { padding: 8px 10px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 13px; width: 200px; }
.filter-bar select { padding: 8px 10px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 13px; }
.data-table { width: 100%; background: #fff; border-collapse: collapse; border-radius: 8px; overflow: hidden; font-size: 13px; }
.data-table th, .data-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #f0f0f0; }
.data-table th { background: #fafafa; }
.row-warn { background: #fffbe6; }
.row-danger { background: #fff2f0; }
.qty-low { color: #faad14; font-weight: bold; }
.qty-zero { color: #ff4d4f; font-weight: bold; }
.link { color: #1890ff; }
.loading { text-align: center; padding: 60px; color: #999; }
</style>
