<template>
  <div class="order-list-page">
    <h2>我的订单</h2>
    <el-radio-group v-model="currentStatus" @change="filterStatus" style="margin-bottom: 16px">
      <el-radio-button value="">全部</el-radio-button>
      <el-radio-button value="pending">待支付</el-radio-button>
      <el-radio-button value="paid">已支付</el-radio-button>
      <el-radio-button value="delivering">配送中</el-radio-button>
      <el-radio-button value="signed">已签收</el-radio-button>
      <el-radio-button value="cancelled">已取消</el-radio-button>
    </el-radio-group>

    <div v-loading="loading">
      <el-empty v-if="!loading && orders.length === 0" description="暂无订单" />
      <div v-else>
        <el-card v-for="order in orders" :key="order.id" class="order-card" shadow="hover">
          <template #header>
            <div class="order-header">
              <span>订单号：{{ order.order_no }}</span>
              <el-tag :type="order.status === 'pending' ? 'warning' : order.status === 'paid' ? 'primary' : order.status === 'cancelled' ? 'info' : order.status === 'signed' ? 'success' : 'primary'" size="small">{{ formatStatus(order.status) }}</el-tag>
              <span v-if="order.status === 'pending'" class="countdown">剩余 {{ getRemaining(order) }}</span>
            </div>
          </template>
          <div class="order-meta">
            <span>金额：<strong class="price">{{ formatPrice(order.total_amount) }}</strong></span>
            <span>支付方式：{{ order.pay_method === 'online' ? '在线支付' : order.pay_method === 'cod' ? '货到付款' : '现场结付' }}</span>
            <span>{{ formatDate(order.created_at) }}</span>
          </div>
          <div class="order-footer">
            <router-link :to="`/orders/${order.id}`"><el-button size="small" type="primary" link>查看详情</el-button></router-link>
            <el-button v-if="order.status === 'pending' && order.pay_method === 'online'" size="small" type="primary" @click="handlePay(order)">去支付</el-button>
            <el-button v-if="order.status === 'pending'" size="small" type="danger" @click="handleCancel(order)">取消订单</el-button>
            <el-button v-if="order.status === 'delivering'" size="small" type="success" @click="handleSign(order)">确认收货</el-button>
          </div>
        </el-card>
      </div>
      <el-pagination :current-page="currentPage" :page-size="pageSize" :total="total" @current-change="changePage" layout="total, prev, pager, next" style="margin-top: 16px; justify-content: center" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getOrders, payOrder, cancelOrder, signOrder } from '@/api/order';
import { ElMessageBox, ElMessage } from 'element-plus';
import { formatPrice, formatDate, getOrderStatusText } from '@/utils/format';

function formatStatus(s) { return getOrderStatusText(s); }

const orders = ref([]); const total = ref(0); const loading = ref(false);
const currentPage = ref(1); const pageSize = ref(10); const currentStatus = ref('');

function getRemaining(order) {
  const created = new Date(order.created_at);
  const deadline = new Date(created.getTime() + 24 * 60 * 60 * 1000);
  const diff = deadline - new Date();
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
  try { await payOrder(order.id); await fetchOrders(); } catch (err) { ElMessage.error(err.message); }
}
async function handleCancel(order) {
  try {
    await ElMessageBox.confirm('确定取消该订单？', '确认操作', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' });
    await cancelOrder(order.id); await fetchOrders();
  } catch { /* 用户取消 */ }
}
async function handleSign(order) {
  try {
    await ElMessageBox.confirm('确认已收到商品？', '确认收货', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' });
    await signOrder(order.id); await fetchOrders();
  } catch { /* 用户取消 */ }
}

onMounted(fetchOrders);
</script>

<style scoped>
.order-card { margin-bottom: 12px; }
.order-header { display: flex; align-items: center; gap: 12px; font-size: 13px; margin: 0; }
.countdown { color: #ff4d4f; margin-left: auto; font-size: 12px; }
.order-meta { display: flex; gap: 24px; font-size: 13px; color: #666; padding: 8px 0; }
.price { color: #ff4d4f; font-size: 16px; }
.order-footer { display: flex; gap: 8px; align-items: center; }
</style>
