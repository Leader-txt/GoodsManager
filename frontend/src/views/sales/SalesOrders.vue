<template>
  <div class="sales-orders">
    <h2>订单记录</h2>

    <div class="filter-bar">
      <select v-model="statusFilter" @change="search">
        <option value="">全部状态</option>
        <option value="pending">待支付</option>
        <option value="paid">已支付</option>
        <option value="shipped">已出库</option>
        <option value="delivering">配送中</option>
        <option value="signed">已签收</option>
        <option value="cancelled">已取消</option>
      </select>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="orders.length === 0" class="empty">暂无订单记录</div>
    <div v-else>
      <table class="data-table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>顾客</th>
            <th>金额</th>
            <th>状态</th>
            <th>提货方式</th>
            <th>时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in orders" :key="o.id">
            <td>{{ o.order_no }}</td>
            <td>{{ o.customer_name }}</td>
            <td>{{ formatPrice(o.total_amount) }}</td>
            <td><OrderStatusTag :status="o.status" /></td>
            <td>{{ o.delivery_type === 'delivery' ? '送货上门' : '自行提货' }}</td>
            <td>{{ formatDate(o.created_at) }}</td>
            <td><router-link :to="`/orders/${o.id}`">查看</router-link></td>
          </tr>
        </tbody>
      </table>
      <Pagination :currentPage="page" :pageSize="10" :total="total" @change="p => { page = p; fetchOrders(); }" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getSalesOrders } from '@/api/order';
import OrderStatusTag from '@/components/order/OrderStatusTag.vue';
import Pagination from '@/components/common/Pagination.vue';
import { formatPrice, formatDate } from '@/utils/format';

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
.filter-bar select { padding: 8px 10px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 13px; }
.data-table { width: 100%; background: #fff; border-collapse: collapse; border-radius: 8px; overflow: hidden; font-size: 13px; }
.data-table th, .data-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #f0f0f0; }
.data-table th { background: #fafafa; }
.loading, .empty { text-align: center; padding: 60px; color: #999; font-size: 16px; }
</style>
