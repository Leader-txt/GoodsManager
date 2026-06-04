<template>
  <div class="dashboard" v-loading="loading">
    <h2>管理后台 — 仪表盘</h2>
    <div v-if="data">
      <el-row :gutter="16" style="margin-bottom: 24px">
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="stat-card">
              <div class="stat-num">{{ data.todayOrders }}</div>
              <div class="stat-label">今日订单</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="stat-card">
              <div class="stat-num">{{ data.pendingOrders }}</div>
              <div class="stat-label">待处理</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="stat-card">
              <div class="stat-num">{{ data.outOfStock }}</div>
              <div class="stat-label">缺货商品</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="stat-card">
              <div class="stat-num">{{ data.salesCount }}</div>
              <div class="stat-label">销售人员</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card class="panel">
        <template #header><h3>最近订单</h3></template>
        <el-table :data="data.recentOrders" size="small" style="width: 100%">
          <el-table-column prop="order_no" label="订单号" />
          <el-table-column prop="customer_name" label="顾客" />
          <el-table-column label="金额" :formatter="(r) => formatPrice(r.total_amount)" />
          <el-table-column label="状态">
            <template #default="{ row }">
              <el-tag :type="row.status === 'pending' ? 'warning' : row.status === 'paid' ? 'primary' : row.status === 'cancelled' ? 'info' : row.status === 'signed' ? 'success' : 'primary'" size="small">{{ formatStatus(row.status) }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card class="panel">
        <template #header><h3>最近出入库</h3></template>
        <el-table :data="data.recentLogs" size="small" style="width: 100%">
          <el-table-column label="时间" :formatter="(r) => formatDate(r.created_at)" />
          <el-table-column label="类型"><template #default="{ row }">{{ row.type === 'in' ? '入库' : '出库' }}</template></el-table-column>
          <el-table-column prop="product_name" label="商品" />
          <el-table-column prop="quantity" label="数量" />
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getDashboard } from '@/api/admin';
import { formatPrice, formatDate, getOrderStatusText } from '@/utils/format';

function formatStatus(s) { return getOrderStatusText(s); }

const data = ref(null);
const loading = ref(true);

onMounted(async () => {
  try { const res = await getDashboard(); if (res.code === 200) data.value = res.data; }
  finally { loading.value = false; }
});
</script>

<style scoped>
.dashboard h2 { margin-bottom: 20px; }
.stat-card { text-align: center; padding: 12px 0; }
.stat-num { font-size: 32px; font-weight: bold; color: #1890ff; }
.stat-label { font-size: 14px; color: #999; margin-top: 4px; }
.panel { margin-bottom: 16px; }
.panel h3 { margin: 0; font-size: 15px; }
</style>
