<template>
  <div class="inv-detail" v-loading="loading">
    <router-link to="/warehouse" class="back-link">← 返回库存总览</router-link>
    <div v-if="!loading && !detail" class="empty-state">库存信息不存在</div>
    <div v-else-if="detail">
      <el-card class="detail-card">
        <template #header><h3>{{ detail.productName }}</h3></template>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="商品ID">{{ detail.productId }}</el-descriptions-item>
          <el-descriptions-item label="所在货架">{{ detail.shelfCode || '未分配' }}</el-descriptions-item>
          <el-descriptions-item label="当前库存">
            <strong :style="{ color: detail.quantity === 0 ? '#ff4d4f' : detail.quantity < 5 ? '#faad14' : '#333' }">{{ detail.quantity }}</strong>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card class="detail-card">
        <template #header><h3>出入库历史</h3></template>
        <el-table v-if="detail.logs && detail.logs.length" :data="detail.logs" stripe style="width: 100%">
          <el-table-column label="时间" :formatter="(r) => formatDate(r.createdAt || r.created_at)" />
          <el-table-column label="类型"><template #default="{ row }">{{ row.type === 'in' ? '入库' : '出库' }}</template></el-table-column>
          <el-table-column label="数量">
            <template #default="{ row }">
              <span :style="{ color: row.type === 'in' ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }">{{ row.type === 'in' ? '+' : '-' }}{{ row.quantity }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作员"><template #default="{ row }">{{ row.operatorName || row.operator_name || '系统' }}</template></el-table-column>
          <el-table-column label="关联订单"><template #default="{ row }">{{ row.orderNo || row.order_no || '-' }}</template></el-table-column>
          <el-table-column label="备注"><template #default="{ row }">{{ row.remark || '' }}</template></el-table-column>
        </el-table>
        <el-empty v-else description="暂无出入库记录" />
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getInventoryDetail } from '@/api/inventory';
import { formatDate } from '@/utils/format';

const route = useRoute();
const detail = ref(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await getInventoryDetail(route.params.productId);
    if (res.code === 200) detail.value = res.data;
  } finally { loading.value = false; }
});
</script>

<style scoped>
.inv-detail { max-width: 900px; margin: 0 auto; padding: 24px; }
.back-link { display: inline-block; margin-bottom: 16px; color: #1890ff; font-size: 14px; }
.detail-card { margin-bottom: 16px; }
.detail-card h3 { margin: 0; font-size: 15px; }
.empty-state { text-align: center; padding: 40px; color: #999; }
</style>
