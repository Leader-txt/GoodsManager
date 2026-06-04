<template>
  <div class="sys-log" v-loading="loading">
    <h2>系统日志</h2>
    <div class="filter-bar">
      <el-select v-model="actionFilter" @change="search" placeholder="全部类型" clearable style="width: 150px">
        <el-option label="下单" value="order_create" />
        <el-option label="支付" value="order_pay" />
        <el-option label="取消" value="order_cancel" />
        <el-option label="签收" value="order_sign" />
        <el-option label="入库" value="inventory_in" />
        <el-option label="出库" value="inventory_out" />
        <el-option label="注册" value="user_register" />
      </el-select>
      <el-date-picker v-model="startDate" @change="search" type="date" placeholder="开始日期" value-format="YYYY-MM-DD" style="width: 150px" />
      <span class="date-sep">~</span>
      <el-date-picker v-model="endDate" @change="search" type="date" placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 150px" />
    </div>

    <el-table :data="logs" stripe style="width: 100%">
      <el-table-column prop="created_at" label="时间" :formatter="(r) => formatDate(r.created_at)" />
      <el-table-column prop="action" label="操作类型" />
      <el-table-column label="操作人"><template #default="{ row }">{{ row.operator_name || '系统' }}</template></el-table-column>
      <el-table-column prop="target_type" label="对象类型" />
      <el-table-column prop="target_id" label="对象ID" />
      <el-table-column label="详情" min-width="200"><template #default="{ row }">{{ row.detail ? JSON.stringify(row.detail).slice(0, 100) : '' }}</template></el-table-column>
    </el-table>

    <el-pagination :current-page="page" :page-size="20" :total="total" @current-change="p=>{page=p;fetchLogs()}" layout="total, prev, pager, next" style="margin-top: 16px; justify-content: center" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getSystemLogs } from '@/api/admin';
import { formatDate } from '@/utils/format';

const logs=ref([]); const total=ref(0); const page=ref(1);
const actionFilter=ref(''); const startDate=ref(''); const endDate=ref('');
const loading=ref(false);

async function fetchLogs() {
  loading.value = true;
  const params={page:page.value, action:actionFilter.value, startDate:startDate.value, endDate:endDate.value};
  const res=await getSystemLogs(params); if(res.code===200){logs.value=res.data.list; total.value=res.data.total;}
  loading.value = false;
}
function search(){page.value=1;fetchLogs();}
onMounted(fetchLogs);
</script>

<style scoped>
.filter-bar { display:flex; gap:8px; margin-bottom:12px; align-items:center; }
.date-sep { color: #999; }
</style>
