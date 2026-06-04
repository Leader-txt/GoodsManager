<template>
  <div class="order-detail-page" v-loading="loading">
    <router-link to="/orders" class="back-link">← 返回订单列表</router-link>
    <div v-if="!loading && !order" class="empty-state">订单不存在</div>
    <div v-else-if="order">
      <el-card class="detail-card">
        <template #header>
          <div class="status-line">
            <span>订单状态：</span>
            <el-tag :type="order.status === 'pending' ? 'warning' : order.status === 'paid' ? 'primary' : order.status === 'cancelled' ? 'info' : order.status === 'signed' ? 'success' : 'primary'">{{ formatStatus(order.status) }}</el-tag>
          </div>
        </template>
        <el-steps :active="activeStep" finish-status="success" align-center>
          <el-step v-for="step in timelineSteps" :key="step.label" :title="step.label" :description="step.time" />
        </el-steps>
      </el-card>

      <el-card class="detail-card">
        <template #header><h3>订单信息</h3></template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单编号">{{ order.order_no }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(order.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="支付方式">{{ order.pay_method === 'online' ? '在线支付' : order.pay_method === 'cod' ? '货到付款' : '现场结付' }}</el-descriptions-item>
          <el-descriptions-item label="提货方式">{{ order.delivery_type === 'delivery' ? '送货上门' : '自行提货' }}</el-descriptions-item>
          <el-descriptions-item v-if="order.address" label="收货地址">{{ order.address }}</el-descriptions-item>
          <el-descriptions-item label="收件人">{{ order.customer_name }} {{ order.customer_phone }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card class="detail-card">
        <template #header><h3>商品明细</h3></template>
        <el-table :data="order.items" style="width: 100%">
          <el-table-column label="商品">
            <template #default="{ row }">
              <div style="display:flex;align-items:center;gap:8px">
                <img :src="row.product_image || '/placeholder.png'" style="width:40px;height:40px;object-fit:contain" />
                {{ row.product_name }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="单价" :formatter="(r) => formatPrice(r.price)" />
          <el-table-column prop="quantity" label="数量" />
          <el-table-column label="小计"><template #default="{ row }"><span style="color:#ff4d4f;font-weight:bold">{{ formatPrice(row.price * row.quantity) }}</span></template></el-table-column>
        </el-table>
        <div class="total-line">合计：<strong>{{ formatPrice(order.total_amount) }}</strong></div>
      </el-card>

      <LogisticsInfo v-if="order.delivery_type === 'delivery'" :order="order" />

      <div v-if="order.status === 'pending' && order.pay_method === 'online'" class="actions">
        <el-button type="primary" size="large" @click="handlePay">去支付</el-button>
        <el-button size="large" @click="handleCancel">取消订单</el-button>
      </div>
      <div v-if="order.status === 'delivering'" class="actions">
        <el-button type="success" size="large" @click="handleSign">确认收货</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getOrderDetail, payOrder, cancelOrder, signOrder } from '@/api/order';
import { ElMessageBox, ElMessage } from 'element-plus';
import LogisticsInfo from '@/components/order/LogisticsInfo.vue';
import { formatPrice, formatDate, getOrderStatusText } from '@/utils/format';

function formatStatus(s) { return getOrderStatusText(s); }

const route = useRoute();
const router = useRouter();
const order = ref(null);
const loading = ref(true);

const timelineSteps = computed(() => {
  if (!order.value) return [];
  const o = order.value;
  const steps = [
    { label: '已下单', time: formatDate(o.created_at) },
    { label: '已支付', time: o.paid_at ? formatDate(o.paid_at) : '---' },
  ];
  if (o.delivery_type !== 'self_pickup') {
    steps.push({ label: '已出库', time: '---' });
    steps.push({ label: '配送中', time: '---' });
  }
  steps.push({ label: '已签收', time: '---' });
  if (o.status === 'cancelled') {
    steps.push({ label: '已取消', time: formatDate(o.cancelled_at) });
  }
  return steps;
});

const activeStep = computed(() => {
  if (!order.value) return 0;
  const s = order.value.status;
  if (s === 'cancelled') return timelineSteps.value.length - 1;
  const map = { pending: 0, paid: 1, shipped: 2, delivering: 3, signed: timelineSteps.value.length - 1 };
  return map[s] || 0;
});

async function loadOrder() {
  try { const res = await getOrderDetail(route.params.id); if (res.code === 200) order.value = res.data; }
  finally { loading.value = false; }
}

async function handlePay() { await payOrder(order.value.id); await loadOrder(); }
async function handleCancel() {
  try {
    await ElMessageBox.confirm('确定取消该订单？', '确认操作', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' });
    await cancelOrder(order.value.id); await loadOrder();
  } catch { /* 用户取消 */ }
}
async function handleSign() {
  try {
    await ElMessageBox.confirm('确认已收到商品？', '确认收货', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' });
    await signOrder(order.value.id); await loadOrder();
  } catch { /* 用户取消 */ }
}

onMounted(loadOrder);
</script>

<style scoped>
.back-link { display: inline-block; margin-bottom: 16px; color: #1890ff; }
.detail-card { margin-bottom: 16px; }
.detail-card h3 { margin: 0; }
.status-line { display: flex; align-items: center; gap: 8px; font-size: 16px; }
.total-line { text-align: right; padding: 12px 0; }
.total-line strong { color: #ff4d4f; font-size: 20px; }
.actions { display: flex; gap: 12px; margin-top: 16px; }
.empty-state { text-align: center; padding: 60px; color: #999; }
</style>
