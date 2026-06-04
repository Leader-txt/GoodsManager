<template>
  <div class="page" v-loading="loading">
    <h2>待出库订单</h2>

    <div class="filter-bar">
      <el-select v-model="statusFilter" @change="search" placeholder="全部状态" clearable style="width: 140px">
        <el-option label="待支付" value="pending" />
        <el-option label="已支付" value="paid" />
        <el-option label="已出库" value="shipped" />
        <el-option label="配送中" value="delivering" />
        <el-option label="已签收" value="signed" />
        <el-option label="已取消" value="cancelled" />
      </el-select>
    </div>

    <el-alert v-if="errMsg" :title="errMsg" type="error" show-icon :closable="false" style="margin-bottom: 12px" />
    <el-alert v-if="successMsg" :title="successMsg" type="success" show-icon :closable="false" style="margin-bottom: 12px" />

    <el-empty v-if="!loading && orders.length === 0" description="暂无待处理的订单" />

    <template v-else>
      <el-table :data="orders" stripe style="width: 100%">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-content">
              <el-descriptions :column="2" border size="small" style="margin-bottom: 12px">
                <el-descriptions-item label="订单编号">{{ row.order_no }}</el-descriptions-item>
                <el-descriptions-item label="顾客姓名">{{ row.customer_name }}</el-descriptions-item>
                <el-descriptions-item label="联系电话">{{ row.customer_phone || '暂无' }}</el-descriptions-item>
                <el-descriptions-item label="支付方式">{{ payMethodText(row.pay_method) }}</el-descriptions-item>
                <el-descriptions-item label="提货方式">{{ row.delivery_type === 'delivery' ? '送货上门' : '自行提货' }}</el-descriptions-item>
                <el-descriptions-item v-if="row.delivery_type === 'delivery' && row.address" label="收货地址">{{ row.address }}</el-descriptions-item>
              </el-descriptions>

              <h4>商品明细</h4>
              <el-table v-if="detailItems[row.id]?.length" :data="detailItems[row.id]" size="small" style="width: 100%">
                <el-table-column prop="product_name" label="商品名称" />
                <el-table-column label="单价" :formatter="(r) => formatPrice(r.price)" />
                <el-table-column prop="quantity" label="数量" />
                <el-table-column label="小计" :formatter="(r) => formatPrice(r.price * r.quantity)" />
              </el-table>
              <p v-else class="loading-text">加载中...</p>

              <LogisticsInfo v-if="row.express_company" :order="row" />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="order_no" label="订单编号" />
        <el-table-column prop="customer_name" label="顾客" />
        <el-table-column label="金额" :formatter="(r) => formatPrice(r.total_amount)" />
        <el-table-column label="状态">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ formatStatus(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提货方式"><template #default="{ row }">{{ row.delivery_type === 'delivery' ? '送货上门' : '自行提货' }}</template></el-table-column>
        <el-table-column label="创建时间" :formatter="(r) => formatDate(r.created_at)" />
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="toggleDetail(row.id)">{{ expandedId === row.id ? '收起详情' : '查看详情' }}</el-button>
            <el-button v-if="canShip(row)" size="small" type="primary" @click="confirmShip(row)">一键出库</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        @current-change="p => { page = p; fetchOrders(); }"
        layout="total, prev, pager, next"
        style="margin-top: 16px; justify-content: center"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getWarehouseOrders, getOrderDetail } from '@/api/order';
import { stockOutBatch } from '@/api/inventory';
import { ElMessageBox, ElMessage } from 'element-plus';
import LogisticsInfo from '@/components/order/LogisticsInfo.vue';
import { formatPrice, formatDate, getOrderStatusText } from '@/utils/format';

function formatStatus(s) { return getOrderStatusText(s); }
function statusType(s) {
  const map = { pending: 'warning', paid: 'primary', shipped: '', delivering: '', signed: 'success', cancelled: 'info' };
  return map[s] || 'info';
}

const orders = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const statusFilter = ref('paid');

const expandedId = ref(null);
const detailItems = ref({});

const errMsg = ref('');
const successMsg = ref('');

async function fetchOrders() {
  loading.value = true;
  errMsg.value = '';
  try {
    const res = await getWarehouseOrders({
      page: page.value,
      pageSize: pageSize.value,
      status: statusFilter.value || undefined,
    });
    if (res.code === 200) {
      orders.value = res.data.list;
      total.value = res.data.total;
    }
  } catch (err) {
    errMsg.value = err.message || '加载订单失败';
  } finally {
    loading.value = false;
  }
}

function search() { page.value = 1; fetchOrders(); }

async function toggleDetail(orderId) {
  if (expandedId.value === orderId) {
    expandedId.value = null;
    return;
  }
  expandedId.value = orderId;
  if (!detailItems.value[orderId]) {
    try {
      const res = await getOrderDetail(orderId);
      if (res.code === 200) {
        detailItems.value[orderId] = res.data.items || [];
      }
    } catch {
      detailItems.value[orderId] = [];
    }
  }
}

function canShip(order) {
  return order.status === 'paid' ||
    (order.status === 'pending' && order.pay_method === 'cod');
}

function confirmShip(order) {
  ElMessageBox.confirm(
    `确定要对订单 ${order.order_no}（顾客：${order.customer_name}）执行出库操作吗？`,
    '确认出库',
    { confirmButtonText: '确认出库', cancelButtonText: '取消', type: 'warning' }
  ).then(() => handleShip(order)).catch(() => {});
}

async function handleShip(order) {
  if (!order) return;
  errMsg.value = '';
  successMsg.value = '';
  try {
    const res = await stockOutBatch(order.order_no);
    if (res.code === 200) {
      ElMessage.success(`订单 ${order.order_no} 出库成功`);
      expandedId.value = null;
      await fetchOrders();
    }
  } catch (err) {
    errMsg.value = err.message || '出库失败';
  }
}

function payMethodText(method) {
  const map = { online: '在线支付', cod: '货到付款', offline: '现场结付' };
  return map[method] || method;
}

onMounted(fetchOrders);
</script>

<style scoped>
.page { max-width: 1100px; margin: 0 auto; padding: 24px; }
h2 { margin: 0 0 16px; font-size: 20px; }
.filter-bar { margin-bottom: 16px; }
.expand-content { padding: 12px 20px; background: #fafafa; }
.expand-content h4 { margin: 0 0 8px; font-size: 14px; }
.loading-text { text-align: center; color: #999; padding: 12px 0; }
</style>
