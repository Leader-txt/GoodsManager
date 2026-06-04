<template>
  <div class="sales-orders" v-loading="loading">
    <h2>订单记录</h2>

    <div class="filter-bar">
      <el-select v-model="statusFilter" @change="search" placeholder="全部状态" clearable style="width: 140px">
        <el-option label="待支付" value="pending" />
        <el-option label="已支付" value="paid" />
        <el-option label="已出库" value="shipped" />
        <el-option label="配送中" value="delivering" />
        <el-option label="已签收" value="signed" />
        <el-option label="已取消" value="cancelled" />
      </el-select>
    </div>

    <el-empty v-if="!loading && orders.length === 0" description="暂无订单记录" />

    <template v-else>
      <el-table :data="orders" stripe style="width: 100%">
        <el-table-column prop="order_no" label="订单号" />
        <el-table-column prop="customer_name" label="顾客" />
        <el-table-column label="金额" :formatter="(r) => formatPrice(r.total_amount)" />
        <el-table-column label="状态">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ formatStatus(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提货方式"><template #default="{ row }">{{ row.delivery_type === 'delivery' ? '送货上门' : '自行提货' }}</template></el-table-column>
        <el-table-column label="时间" :formatter="(r) => formatDate(r.created_at)" />
        <el-table-column label="操作">
          <template #default="{ row }">
            <router-link :to="`/orders/${row.id}`"><el-button size="small" type="primary" link>查看</el-button></router-link>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination :current-page="page" :page-size="10" :total="total" @current-change="p => { page = p; fetchOrders(); }" layout="total, prev, pager, next" style="margin-top: 16px; justify-content: center" />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getSalesOrders } from '@/api/order';
import { formatPrice, formatDate, getOrderStatusText } from '@/utils/format';

function formatStatus(s) { return getOrderStatusText(s); }
function statusType(s) {
  const map = { pending: 'warning', paid: 'primary', shipped: '', delivering: '', signed: 'success', cancelled: 'info' };
  return map[s] || 'info';
}

const orders = ref([]);
const total = ref(0);
const page = ref(1);
const loading = ref(false);
const statusFilter = ref('');

async function fetchOrders() {
  loading.value = true;
  try {
    const params = { page: page.value, status: statusFilter.value };
    const res = await getSalesOrders(params);
    if (res.code === 200) {
      orders.value = res.data.list;
      total.value = res.data.total;
    }
  } finally { loading.value = false; }
}

function search() { page.value = 1; fetchOrders(); }

onMounted(fetchOrders);
</script>

<style scoped>
.sales-orders { max-width: 1000px; margin: 0 auto; padding: 24px; }
.sales-orders h2 { margin-bottom: 16px; }
.filter-bar { display: flex; gap: 8px; margin-bottom: 12px; }
</style>
