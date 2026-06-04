<template>
  <div class="dashboard">
    <h2>管理后台 — 仪表盘</h2>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="data">
      <div class="stat-cards">
        <div class="stat-card"><div class="stat-num">{{ data.todayOrders }}</div><div class="stat-label">今日订单</div></div>
        <div class="stat-card"><div class="stat-num">{{ data.pendingOrders }}</div><div class="stat-label">待处理</div></div>
        <div class="stat-card"><div class="stat-num">{{ data.outOfStock }}</div><div class="stat-label">缺货商品</div></div>
        <div class="stat-card"><div class="stat-num">{{ data.salesCount }}</div><div class="stat-label">销售人员</div></div>
      </div>
      <div class="panel">
        <h3>最近订单</h3>
        <table class="mini-table"><thead><tr><th>订单号</th><th>顾客</th><th>金额</th><th>状态</th></tr></thead>
          <tbody><tr v-for="o in data.recentOrders" :key="o.id"><td>{{ o.order_no }}</td><td>{{ o.customer_name }}</td><td>{{ formatPrice(o.total_amount) }}</td><td><OrderStatusTag :status="o.status" /></td></tr></tbody>
        </table>
      </div>
      <div class="panel">
        <h3>最近出入库</h3>
        <table class="mini-table"><thead><tr><th>时间</th><th>类型</th><th>商品</th><th>数量</th></tr></thead>
          <tbody><tr v-for="l in data.recentLogs" :key="l.id"><td>{{ formatDate(l.created_at) }}</td><td>{{ l.type === 'in' ? '入库' : '出库' }}</td><td>{{ l.product_name }}</td><td>{{ l.quantity }}</td></tr></tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getDashboard } from '@/api/admin';
import OrderStatusTag from '@/components/order/OrderStatusTag.vue';
import { formatPrice, formatDate } from '@/utils/format';

const data = ref(null);
const loading = ref(true);

onMounted(async () => {
  try { const res = await getDashboard(); if (res.code === 200) data.value = res.data; }
  finally { loading.value = false; }
});
</script>

<style scoped>
.stat-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.stat-card { background: #fff; padding: 24px; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.stat-num { font-size: 32px; font-weight: bold; color: #1890ff; }
.stat-label { font-size: 14px; color: #999; margin-top: 4px; }
.panel { background: #fff; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
.panel h3 { margin-bottom: 12px; font-size: 15px; }
.mini-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.mini-table th, .mini-table td { padding: 8px; text-align: left; border-bottom: 1px solid #f0f0f0; }
.mini-table th { color: #999; }
.loading { text-align: center; padding: 60px; color: #999; }
</style>
