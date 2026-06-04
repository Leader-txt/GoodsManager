<template>
  <div class="order-detail-page">
    <router-link to="/orders" class="back-link">← 返回订单列表</router-link>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="!order" class="empty">订单不存在</div>
    <div v-else>
      <!-- 状态 -->
      <div class="detail-card">
        <div class="status-line">
          <span>订单状态：</span>
          <OrderStatusTag :status="order.status" />
        </div>
        <div class="status-timeline">
          <template v-for="step in timelineSteps" :key="step.label">
            <div class="timeline-item" :class="{ done: step.done }">
              <span>{{ step.label }}</span><span>{{ step.time }}</span>
            </div>
          </template>
        </div>
      </div>

      <!-- 订单信息 -->
      <div class="detail-card">
        <h3>订单信息</h3>
        <div class="info-grid">
          <div><span class="lbl">订单编号：</span>{{ order.order_no }}</div>
          <div><span class="lbl">创建时间：</span>{{ formatDate(order.created_at) }}</div>
          <div><span class="lbl">支付方式：</span>{{ order.pay_method === 'online' ? '在线支付' : order.pay_method === 'cod' ? '货到付款' : '现场结付' }}</div>
          <div><span class="lbl">提货方式：</span>{{ order.delivery_type === 'delivery' ? '送货上门' : '自行提货' }}</div>
          <div v-if="order.address"><span class="lbl">收货地址：</span>{{ order.address }}</div>
          <div><span class="lbl">收件人：</span>{{ order.customer_name }} {{ order.customer_phone }}</div>
        </div>
      </div>

      <!-- 商品明细 -->
      <div class="detail-card">
        <h3>商品明细</h3>
        <table class="item-table">
          <thead><tr><th>商品</th><th>单价</th><th>数量</th><th>小计</th></tr></thead>
          <tbody>
            <tr v-for="item in order.items" :key="item.id">
              <td><img :src="item.product_image || '/placeholder.png'" class="item-img" />{{ item.product_name }}</td>
              <td>{{ formatPrice(item.price) }}</td>
              <td>{{ item.quantity }}</td>
              <td class="subtotal">{{ formatPrice(item.price * item.quantity) }}</td>
            </tr>
          </tbody>
        </table>
        <div class="total-line">合计：<strong>{{ formatPrice(order.total_amount) }}</strong></div>
      </div>

      <!-- 物流信息 -->
      <LogisticsInfo v-if="order.delivery_type === 'delivery'" :order="order" />

      <!-- 操作按钮 -->
      <div v-if="order.status === 'pending' && order.pay_method === 'online'" class="actions">
        <button @click="handlePay" class="btn-pay">去支付</button>
        <button @click="handleCancel" class="btn-cancel">取消订单</button>
      </div>
      <div v-if="order.status === 'delivering'" class="actions">
        <button @click="handleSign" class="btn-sign">确认收货</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getOrderDetail, payOrder, cancelOrder, signOrder } from '@/api/order';
import OrderStatusTag from '@/components/order/OrderStatusTag.vue';
import LogisticsInfo from '@/components/order/LogisticsInfo.vue';
import { formatPrice, formatDate } from '@/utils/format';

const route = useRoute();
const router = useRouter();
const order = ref(null);
const loading = ref(true);

const timelineSteps = computed(() => {
  if (!order.value) return [];
  const o = order.value;
  const steps = [
    { label: '已下单', done: true, time: formatDate(o.created_at) },
    { label: '已支付', done: !!o.paid_at, time: o.paid_at ? formatDate(o.paid_at) : '---' },
  ];
  if (o.delivery_type !== 'self_pickup') {
    steps.push({ label: '已出库', done: ['shipped','delivering','signed'].includes(o.status), time: '---' });
    steps.push({ label: '配送中', done: ['delivering','signed'].includes(o.status), time: '---' });
  }
  steps.push({ label: '已签收', done: o.status === 'signed', time: '---' });
  if (o.status === 'cancelled') {
    steps.push({ label: '已取消', done: true, time: formatDate(o.cancelled_at) });
  }
  return steps;
});

async function loadOrder() {
  try {
    const res = await getOrderDetail(route.params.id);
    if (res.code === 200) order.value = res.data;
  } finally { loading.value = false; }
}

async function handlePay() { await payOrder(order.value.id); await loadOrder(); }
async function handleCancel() { if(confirm('确定取消？')) { await cancelOrder(order.value.id); await loadOrder(); } }
async function handleSign() { if(confirm('确认收货？')) { await signOrder(order.value.id); await loadOrder(); } }

onMounted(loadOrder);
</script>

<style scoped>
.back-link { display: inline-block; margin-bottom: 16px; color: #1890ff; }
.detail-card { background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 16px; }
.detail-card h3 { margin-bottom: 12px; }
.status-line { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; font-size: 16px; }
.status-timeline { display: flex; gap: 4px; }
.timeline-item { flex: 1; text-align: center; padding: 8px; background: #f5f5f5; border-radius: 4px; font-size: 12px; color: #999; }
.timeline-item.done { background: #e6f7ff; color: #1890ff; }
.timeline-item span { display: block; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; }
.lbl { color: #999; }
.item-table { width: 100%; border-collapse: collapse; }
.item-table th, .item-table td { padding: 10px; text-align: left; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
.item-img { width: 40px; height: 40px; object-fit: contain; margin-right: 8px; vertical-align: middle; }
.subtotal { color: #ff4d4f; font-weight: bold; }
.total-line { text-align: right; padding: 12px 0; }
.total-line strong { color: #ff4d4f; font-size: 20px; }
.actions { display: flex; gap: 12px; margin-top: 16px; }
.btn-pay, .btn-sign { padding: 10px 24px; background: #1890ff; color: #fff; border: none; border-radius: 4px; font-size: 15px; }
.btn-cancel { padding: 10px 24px; background: #fff; color: #ff4d4f; border: 1px solid #ff4d4f; border-radius: 4px; }
.loading, .empty { text-align: center; padding: 60px; color: #999; }
</style>
