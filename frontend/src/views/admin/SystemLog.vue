<template>
  <div class="sys-log"><h2>系统日志</h2>
    <div class="filter-bar">
      <select v-model="actionFilter" @change="search">
        <option value="">全部类型</option>
        <option value="order_create">下单</option><option value="order_pay">支付</option>
        <option value="order_cancel">取消</option><option value="order_sign">签收</option>
        <option value="inventory_in">入库</option><option value="inventory_out">出库</option>
        <option value="user_register">注册</option>
      </select>
      <input type="date" v-model="startDate" @change="search" /> ~ <input type="date" v-model="endDate" @change="search" />
    </div>
    <table class="data-table"><thead><tr><th>时间</th><th>操作类型</th><th>操作人</th><th>对象类型</th><th>对象ID</th><th>详情</th></tr></thead>
      <tbody><tr v-for="l in logs" :key="l.id"><td>{{formatDate(l.created_at)}}</td><td>{{l.action}}</td><td>{{l.operator_name||'系统'}}</td><td>{{l.target_type}}</td><td>{{l.target_id}}</td><td class="detail-cell">{{l.detail?JSON.stringify(l.detail).slice(0,100):''}}</td></tr></tbody>
    </table>
    <Pagination :currentPage="page" :pageSize="20" :total="total" @change="p=>{page=p;fetchLogs()}" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getSystemLogs } from '@/api/admin';
import Pagination from '@/components/common/Pagination.vue';
import { formatDate } from '@/utils/format';

const logs=ref([]); const total=ref(0); const page=ref(1);
const actionFilter=ref(''); const startDate=ref(''); const endDate=ref('');

async function fetchLogs() {
  const params={page:page.value, action:actionFilter.value, startDate:startDate.value, endDate:endDate.value};
  const res=await getSystemLogs(params); if(res.code===200){logs.value=res.data.list; total.value=res.data.total;}
}
function search(){page.value=1;fetchLogs();}
onMounted(fetchLogs);
</script>

<style scoped>
.filter-bar { display:flex; gap:8px; margin-bottom:12px; align-items:center; }
.filter-bar select,.filter-bar input { padding:8px 10px; border:1px solid #d9d9d9; border-radius:4px; font-size:13px; }
.data-table { width:100%; background:#fff; border-collapse:collapse; border-radius:8px; overflow:hidden; font-size:13px; }
.data-table th,.data-table td { padding:10px 12px; text-align:left; border-bottom:1px solid #f0f0f0; }
.data-table th { background:#fafafa; }
.detail-cell { max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
</style>
