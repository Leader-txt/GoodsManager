<template>
  <div class="inv-log"><h2>出入库日志</h2>
    <div class="filter-bar">
      <select v-model="typeFilter" @change="search"><option value="">全部类型</option><option value="in">入库</option><option value="out">出库</option></select>
      <select v-model="operatorFilter" @change="search"><option value="">全部操作员</option><option v-for="op in operators" :key="op.id" :value="op.id">{{ op.username }}</option></select>
      <input type="date" v-model="startDate" @change="search" /> ~ <input type="date" v-model="endDate" @change="search" />
    </div>
    <table class="data-table"><thead><tr><th>时间</th><th>类型</th><th>商品</th><th>数量</th><th>操作员</th><th>关联订单</th><th>备注</th></tr></thead>
      <tbody><tr v-for="l in logs" :key="l.id"><td>{{formatDate(l.created_at)}}</td><td>{{l.type==='in'?'入库':'出库'}}</td><td>{{l.product_name}}</td><td>{{l.type==='in'?'+':'-'}}{{l.quantity}}</td><td>{{l.operator_name||'系统'}}</td><td>{{l.order_no||'-'}}</td><td>{{l.remark||''}}</td></tr></tbody>
    </table>
    <Pagination :currentPage="page" :pageSize="10" :total="total" @change="p=>{page=p;fetchLogs()}" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getInventoryLogs, getOperators } from '@/api/admin';
import Pagination from '@/components/common/Pagination.vue';
import { formatDate } from '@/utils/format';

const logs=ref([]); const total=ref(0); const page=ref(1);
const typeFilter=ref(''); const startDate=ref(''); const endDate=ref('');
const operatorFilter=ref(''); const operators=ref([]);

async function fetchLogs() {
  const params={page:page.value, type:typeFilter.value, startDate:startDate.value, endDate:endDate.value, operatorId:operatorFilter.value};
  const res=await getInventoryLogs(params); if(res.code===200){logs.value=res.data.list; total.value=res.data.total;}
}
function search(){page.value=1;fetchLogs();}
onMounted(async () => {
  try {
    const res = await getOperators();
    if (res.code === 200) operators.value = res.data;
  } catch { /* ignore */ }
  fetchLogs();
});
</script>

<style scoped>
.filter-bar { display:flex; gap:8px; margin-bottom:12px; align-items:center; }
.filter-bar select,.filter-bar input { padding:8px 10px; border:1px solid #d9d9d9; border-radius:4px; font-size:13px; }
.data-table { width:100%; background:#fff; border-collapse:collapse; border-radius:8px; overflow:hidden; font-size:13px; }
.data-table th,.data-table td { padding:10px 12px; text-align:left; border-bottom:1px solid #f0f0f0; }
.data-table th { background:#fafafa; }
</style>
