<template>
  <div class="order-manage"><h2>全部订单</h2>
    <div class="filter-bar">
      <input v-model="keyword" @keyup.enter="search" placeholder="搜索订单号/顾客姓名..." />
      <select v-model="statusFilter" @change="search"><option value="">全部状态</option><option v-for="(v,k) in ORDER_STATUS_MAP" :key="k" :value="k">{{v}}</option></select>
      <select v-model="channelFilter" @change="search"><option value="">全部渠道</option><option value="online">线上</option><option value="offline">线下</option></select>
      <input type="date" v-model="startDate" @change="search" title="起始日期" />
      <span>~</span>
      <input type="date" v-model="endDate" @change="search" title="截止日期" />
    </div>
    <table class="data-table"><thead><tr><th>订单号</th><th>顾客</th><th>金额</th><th>状态</th><th>渠道</th><th>时间</th><th>操作</th></tr></thead>
      <tbody><tr v-for="o in orders" :key="o.id"><td>{{o.order_no}}</td><td>{{o.customer_name}}</td><td>{{formatPrice(o.total_amount)}}</td><td><OrderStatusTag :status="o.status"/></td><td>{{o.sales_id?'线下':'线上'}}</td><td>{{formatDate(o.created_at)}}</td><td><router-link :to="`/orders/${o.id}`">查看</router-link></td></tr></tbody>
    </table>
    <Pagination :currentPage="page" :pageSize="10" :total="total" @change="p=>{page=p;fetchOrders()}" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getAdminOrders } from '@/api/admin';
import OrderStatusTag from '@/components/order/OrderStatusTag.vue';
import Pagination from '@/components/common/Pagination.vue';
import { formatPrice, formatDate, ORDER_STATUS_MAP } from '@/utils/format';

const orders=ref([]); const total=ref(0); const page=ref(1);
const keyword=ref(''); const statusFilter=ref('');
const channelFilter=ref(''); const startDate=ref(''); const endDate=ref('');

async function fetchOrders() {
  const params={page:page.value, keyword:keyword.value, status:statusFilter.value, channel:channelFilter.value, startDate:startDate.value, endDate:endDate.value};
  const res=await getAdminOrders(params); if(res.code===200){orders.value=res.data.list; total.value=res.data.total;}
}
function search(){page.value=1;fetchOrders();}
onMounted(fetchOrders);
</script>

<style scoped>
.filter-bar { display:flex; gap:8px; margin-bottom:12px; }
.filter-bar input,.filter-bar select { padding:8px 10px; border:1px solid #d9d9d9; border-radius:4px; font-size:13px; }
.data-table { width:100%; background:#fff; border-collapse:collapse; border-radius:8px; overflow:hidden; font-size:13px; }
.data-table th,.data-table td { padding:10px 12px; text-align:left; border-bottom:1px solid #f0f0f0; }
.data-table th { background:#fafafa; }
</style>
