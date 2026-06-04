<template>
  <div class="order-manage" v-loading="loading">
    <h2>全部订单</h2>
    <div class="filter-bar">
      <el-input v-model="keyword" @keyup.enter="search" placeholder="搜索订单号/顾客姓名..." clearable style="width: 220px" />
      <el-select v-model="statusFilter" @change="search" placeholder="全部状态" clearable style="width: 130px">
        <el-option v-for="(v,k) in ORDER_STATUS_MAP" :key="k" :label="v" :value="k" />
      </el-select>
      <el-select v-model="channelFilter" @change="search" placeholder="全部渠道" clearable style="width: 120px">
        <el-option label="线上" value="online" />
        <el-option label="线下" value="offline" />
      </el-select>
      <el-date-picker v-model="startDate" @change="search" type="date" placeholder="起始日期" value-format="YYYY-MM-DD" style="width: 150px" />
      <span class="date-sep">~</span>
      <el-date-picker v-model="endDate" @change="search" type="date" placeholder="截止日期" value-format="YYYY-MM-DD" style="width: 150px" />
    </div>

    <el-table :data="orders" stripe style="width: 100%">
      <el-table-column prop="order_no" label="订单号" />
      <el-table-column prop="customer_name" label="顾客" />
      <el-table-column label="金额" :formatter="(r) => formatPrice(r.total_amount)" />
      <el-table-column label="状态">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ ORDER_STATUS_MAP[row.status] || row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="渠道"><template #default="{ row }">{{ row.sales_id ? '线下' : '线上' }}</template></el-table-column>
      <el-table-column label="时间" :formatter="(r) => formatDate(r.created_at)" />
      <el-table-column label="操作">
        <template #default="{ row }">
          <router-link :to="`/orders/${row.id}`"><el-button size="small" type="primary" link>查看</el-button></router-link>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination :current-page="page" :page-size="10" :total="total" @current-change="p=>{page=p;fetchOrders()}" layout="total, prev, pager, next" style="margin-top: 16px; justify-content: center" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getAdminOrders } from '@/api/admin';
import { formatPrice, formatDate, ORDER_STATUS_MAP } from '@/utils/format';

const orders=ref([]); const total=ref(0); const page=ref(1); const loading=ref(false);
const keyword=ref(''); const statusFilter=ref('');
const channelFilter=ref(''); const startDate=ref(''); const endDate=ref('');

function statusType(s) {
  const map = { pending: 'warning', paid: 'primary', shipped: '', delivering: '', signed: 'success', cancelled: 'info' };
  return map[s] || 'info';
}

async function fetchOrders() {
  loading.value = true;
  const params={page:page.value, keyword:keyword.value, status:statusFilter.value, channel:channelFilter.value, startDate:startDate.value, endDate:endDate.value};
  const res=await getAdminOrders(params); if(res.code===200){orders.value=res.data.list; total.value=res.data.total;}
  loading.value = false;
}
function search(){page.value=1;fetchOrders();}
onMounted(fetchOrders);
</script>

<style scoped>
.filter-bar { display:flex; gap:8px; margin-bottom:12px; flex-wrap: wrap; align-items: center; }
.date-sep { color: #999; }
</style>
