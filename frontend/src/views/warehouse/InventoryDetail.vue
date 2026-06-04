<template>
  <div class="inv-detail"><router-link to="/warehouse" class="back-link">← 返回库存总览</router-link>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="!detail" class="empty">库存信息不存在</div>
    <div v-else>
      <div class="detail-card">
        <h3>{{ detail.productName }}</h3>
        <div class="info-grid">
          <div><span class="lbl">商品ID：</span>{{ detail.productId }}</div>
          <div><span class="lbl">所在货架：</span>{{ detail.shelfCode || '未分配' }}</div>
          <div><span class="lbl">当前库存：</span><strong :class="detail.quantity > 0 ? (detail.quantity < 5 ? 'qty-low' : '') : 'qty-zero'">{{ detail.quantity }}</strong></div>
        </div>
      </div>

      <div class="detail-card">
        <h3>出入库历史</h3>
        <table v-if="detail.logs && detail.logs.length" class="data-table">
          <thead><tr><th>时间</th><th>类型</th><th>数量</th><th>操作员</th><th>关联订单</th><th>备注</th></tr></thead>
          <tbody>
            <tr v-for="log in detail.logs" :key="log.id">
              <td>{{ formatDate(log.createdAt || log.created_at) }}</td>
              <td>{{ log.type === 'in' ? '入库' : '出库' }}</td>
              <td :class="log.type === 'in' ? 'in-qty' : 'out-qty'">{{ log.type === 'in' ? '+' : '-' }}{{ log.quantity }}</td>
              <td>{{ log.operatorName || log.operator_name || '系统' }}</td>
              <td>{{ log.orderNo || log.order_no || '-' }}</td>
              <td>{{ log.remark || '' }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty">暂无出入库记录</div>
      </div>
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
.detail-card { background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 16px; }
.detail-card h3 { margin-bottom: 12px; }
.info-grid { display: flex; gap: 24px; font-size: 14px; flex-wrap: wrap; }
.lbl { color: #999; }
.qty-low { color: #faad14; }
.qty-zero { color: #ff4d4f; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #f0f0f0; }
.data-table th { background: #fafafa; }
.in-qty { color: #52c41a; font-weight: bold; }
.out-qty { color: #ff4d4f; font-weight: bold; }
.loading, .empty { text-align: center; padding: 40px; color: #999; }
</style>
