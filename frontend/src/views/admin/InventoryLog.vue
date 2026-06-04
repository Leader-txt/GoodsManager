<template>
  <div class="inv-log" v-loading="loading">
    <h2>出入库日志</h2>
    <div class="filter-bar">
      <el-select v-model="typeFilter" @change="search" placeholder="全部类型" clearable style="width: 130px">
        <el-option label="入库" value="in" />
        <el-option label="出库" value="out" />
      </el-select>
      <el-select v-model="operatorFilter" @change="search" placeholder="全部操作员" clearable style="width: 160px">
        <el-option v-for="op in operators" :key="op.id" :label="op.username" :value="op.id" />
      </el-select>
      <el-date-picker v-model="startDate" @change="search" type="date" placeholder="开始日期" value-format="YYYY-MM-DD" style="width: 150px" />
      <span class="date-sep">~</span>
      <el-date-picker v-model="endDate" @change="search" type="date" placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 150px" />
    </div>

    <el-table :data="logs" stripe style="width: 100%">
      <el-table-column prop="created_at" label="时间" :formatter="(r) => formatDate(r.created_at)" />
      <el-table-column label="类型"><template #default="{ row }">{{ row.type === 'in' ? '入库' : '出库' }}</template></el-table-column>
      <el-table-column prop="product_name" label="商品" />
      <el-table-column label="数量"><template #default="{ row }">{{ row.type === 'in' ? '+' : '-' }}{{ row.quantity }}</template></el-table-column>
      <el-table-column label="操作员"><template #default="{ row }">{{ row.operator_name || '系统' }}</template></el-table-column>
      <el-table-column label="关联订单"><template #default="{ row }">{{ row.order_no || '-' }}</template></el-table-column>
      <el-table-column label="备注"><template #default="{ row }">{{ row.remark || '' }}</template></el-table-column>
    </el-table>

    <el-pagination :current-page="page" :page-size="10" :total="total" @current-change="p=>{page=p;fetchLogs()}" layout="total, prev, pager, next" style="margin-top: 16px; justify-content: center" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getInventoryLogs, getOperators } from '@/api/admin';
import { formatDate } from '@/utils/format';

const logs=ref([]); const total=ref(0); const page=ref(1);
const typeFilter=ref(''); const startDate=ref(''); const endDate=ref('');
const operatorFilter=ref(''); const operators=ref([]); const loading=ref(false);

async function fetchLogs() {
  loading.value = true;
  const params={page:page.value, type:typeFilter.value, startDate:startDate.value, endDate:endDate.value, operatorId:operatorFilter.value};
  const res=await getInventoryLogs(params); if(res.code===200){logs.value=res.data.list; total.value=res.data.total;}
  loading.value = false;
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
.filter-bar { display:flex; gap:8px; margin-bottom:12px; align-items:center; flex-wrap: wrap; }
.date-sep { color: #999; }
</style>
