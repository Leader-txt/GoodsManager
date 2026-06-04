<template>
  <div class="order-list-page">
    <h2>我的订单</h2>
    <!-- 状态筛选 -->
    <div class="status-filter">
      <button :class="{ active: !currentStatus }" @click="filterStatus('')">全部</button>
      <button :class="{ active: currentStatus === 'pending' }" @click="filterStatus('pending')">待支付</button>
      <button :class="{ active: currentStatus === 'paid' }" @click="filterStatus('paid')">已支付</button>
      <button :class="{ active: currentStatus === 'delivering' }" @click="filterStatus('delivering')">配送中</button>
      <button :class="{ active: currentStatus === 'signed' }" @click="filterStatus('signed')">已签收</button>
      <button :class="{ active: currentStatus === 'cancelled' }" @click="filterStatus('cancelled')">已取消</button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="orders.length === 0" class="empty">暂无订单</div>
    <div v-else>
      <div v-for="order in orders" :key="order.id" class="order-card">
        <div class="order-header">
          <span>订单号：{{ order.order_no }}</span>
          <OrderStatusTag :status="order.status" />
          <span v-if="order.status === 'pending'" class="countdown">剩余 {{ getRemaining(order) }}</span>
        </div>
        <div class="order-body">
          <div class="order-meta">
            <span>金额：<strong class="price">{{ formatPrice(order.total_amount) }}</strong></span>
            <span>支付方式：{{ order.pay_method === 'online' ? '在线支付' : order.pay_method === 'cod' ? '货到付款' : '现场结付' }}</span>
            <span>{{ formatDate(order.created_at) }}</span>
          </div>
        </div>
        <div class="order-footer">
          <router-link :to="`/orders/${order.id}`">查看详情</router-link>
          <button v-if="order.status === 'pending' && order.pay_method === 'online'" @click="handlePay(order)">去支付</button>
          <button v-if="order.status === 'pending'" @click="handleCancel(order)" class="btn-cancel">取消订单</button>
          <button v-if="order.status === 'delivering'" @click="handleSign(order)">确认收货</button>
        </div>
      </div>
    </div>
    <Pagination :currentPage="currentPage" :pageSize="pageSize" :total="total" @change="changePage" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getOrders, payOrder, cancelOrder, signOrder } from '@/api/order';
import OrderStatusTag from '@/components/order/OrderStatusTag.vue';
import Pagination from '@/components/common/Pagination.vue';
import { formatPrice, formatDate } from '@/utils/format';

const orders = ref([]);
const total = ref(0);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const currentStatus = ref('');

function getRemaining(order) {
  const created = new Date(order.created_at);
  const deadline = new Date(created.getTime() + 24 * 60 * 60 * 1000);
  const now = new Date();
  const diff = deadline - now;
  if (diff <= 0) return '0分钟';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h${m}m`;
}

async function fetchOrders() {
  loading.value = true;
  try {
    const params = { page: currentPage.value, pageSize: pageSize.value };
    if (currentStatus.value) params.status = currentStatus.value;
    const res = await getOrders(params);
    if (res.code === 200) { orders.value = res.data.list; total.value = res.data.total; }
  } finally { loading.value = false; }
}

function filterStatus(s) { currentStatus.value = s; currentPage.value = 1; fetchOrders(); }
function changePage(p) { currentPage.value = p; fetchOrders(); }

async function handlePay(order) {
  try { await payOrder(order.id); await fetchOrders(); } catch (err) { alert(err.message); }
}
async function handleCancel(order) {
  if (!confirm('确定取消该订单？')) return;
  try { await cancelOrder(order.id); await fetchOrders(); } catch (err) { alert(err.message); }
}
async function handleSign(order) {
  if (!confirm('确认已收到商品？')) return;
  try { await signOrder(order.id); await fetchOrders(); } catch (err) { alert(err.message); }
}

onMounted(fetchOrders);
</script>

<style scoped>
.status-filter { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.status-filter button { padding: 6px 16px; border: 1px solid #d9d9d9; background: #fff; border-radius: 4px; font-size: 13px; }
.status-filter button.active { background: #1890ff; color: #fff; border-color: #1890ff; }
.order-card { background: #fff; border-radius: 8px; margin-bottom: 12px; overflow: hidden; }
.order-header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #fafafa; font-size: 13px; }
.countdown { color: #ff4d4f; margin-left: auto; }
.order-body { padding: 12px 16px; }
.order-meta { display: flex; gap: 24px; font-size: 13px; color: #666; }
.price { color: #ff4d4f; font-size: 16px; }
.order-footer { padding: 10px 16px; border-top: 1px solid #f0f0f0; display: flex; gap: 8px; }
.order-footer button { padding: 5px 14px; border: 1px solid #d9d9d9; background: #fff; border-radius: 4px; font-size: 13px; }
.btn-cancel { color: #ff4d4f; border-color: #ff4d4f; }
.loading, .empty { text-align: center; padding: 60px; color: #999; }
</style>
