<template>
  <div class="inventory-page" v-loading="loading">
    <div class="page-header">
      <h2>库存总览</h2>
      <div class="header-actions">
        <el-button type="primary" @click="$router.push('/warehouse/stock-in')">入库</el-button>
        <el-button type="success" @click="$router.push('/warehouse/stock-out')">出库</el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-input v-model="keyword" @keyup.enter="search" placeholder="搜索商品名称/编号..." clearable style="width: 220px" />
      <el-select v-model="categoryFilter" @change="search" placeholder="全部类型" clearable style="width: 150px">
        <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
      </el-select>
      <el-select v-model="stockStatus" @change="search" placeholder="全部库存" clearable style="width: 150px">
        <el-option label="有货" value="in_stock" />
        <el-option label="缺货" value="out_of_stock" />
        <el-option label="低库存(&lt;5)" value="low_stock" />
      </el-select>
    </div>

    <el-empty v-if="!loading && inventory.length === 0" description="暂无库存数据" />

    <template v-else>
      <el-table :data="inventory" stripe :row-class-name="tableRowClassName" style="width: 100%">
        <el-table-column prop="product_id" label="ID" width="70" />
        <el-table-column prop="product_name" label="商品名称" />
        <el-table-column prop="category" label="类型" />
        <el-table-column label="货架"><template #default="{ row }">{{ row.shelf_code || '未分配' }}</template></el-table-column>
        <el-table-column label="库存">
          <template #default="{ row }">
            <span :class="{ 'qty-low': row.quantity > 0 && row.quantity < 5, 'qty-zero': row.quantity === 0 }">{{ row.quantity }}</span>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" :formatter="(r) => formatDate(r.updated_at)" />
        <el-table-column label="操作">
          <template #default="{ row }">
            <router-link :to="`/warehouse/inventory/${row.product_id}`"><el-button size="small" type="primary" link>详情</el-button></router-link>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination :current-page="page" :page-size="pageSize" :total="total" @current-change="p => { page = p; fetchInventory(); }" layout="total, prev, pager, next" style="margin-top: 16px; justify-content: center" />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getInventory } from '@/api/inventory';
import { getCategories } from '@/api/product';
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

function tableRowClassName({ row }) {
  if (row.quantity === 0) return 'row-danger';
  if (row.quantity > 0 && row.quantity < 5) return 'row-warn';
  return '';
}

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
.filter-bar { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.qty-low { color: #faad14; font-weight: bold; }
.qty-zero { color: #ff4d4f; font-weight: bold; }
:deep(.row-warn) { background-color: #fffbe6; }
:deep(.row-danger) { background-color: #fff2f0; }
</style>
