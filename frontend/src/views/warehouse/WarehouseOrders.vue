<template>
  <div class="page">
    <h2>待出库订单</h2>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <select v-model="statusFilter" @change="search">
        <option value="">全部</option>
        <option value="pending">待支付</option>
        <option value="paid">已支付</option>
        <option value="shipped">已出库</option>
        <option value="delivering">配送中</option>
        <option value="signed">已签收</option>
        <option value="cancelled">已取消</option>
      </select>
    </div>

    <!-- 提示信息 -->
    <div v-if="errMsg" class="err-msg">{{ errMsg }}</div>
    <div v-if="successMsg" class="success-msg">{{ successMsg }}</div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading">加载中...</div>

    <!-- 空状态 -->
    <div v-else-if="orders.length === 0" class="empty">暂无待处理的订单</div>

    <!-- 订单列表 -->
    <template v-else>
      <table class="data-table">
        <thead>
          <tr>
            <th>订单编号</th>
            <th>顾客</th>
            <th>金额</th>
            <th>状态</th>
            <th>提货方式</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="order in orders" :key="order.id">
            <tr>
              <td><strong>{{ order.order_no }}</strong></td>
              <td>{{ order.customer_name }}</td>
              <td>{{ formatPrice(order.total_amount) }}</td>
              <td><OrderStatusTag :status="order.status" /></td>
              <td>{{ order.delivery_type === 'delivery' ? '送货上门' : '自行提货' }}</td>
              <td>{{ formatDate(order.created_at) }}</td>
              <td class="actions">
                <button
                  class="btn-detail"
                  @click="toggleDetail(order.id)"
                >{{ expandedId === order.id ? '收起详情' : '查看详情' }}</button>
                <button
                  v-if="canShip(order)"
                  class="btn-ship"
                  @click="confirmShip(order)"
                >一键出库</button>
              </td>
            </tr>
            <!-- 展开的订单详情 -->
            <tr v-if="expandedId === order.id" class="detail-row">
              <td colspan="7">
                <div class="detail-card">
                  <!-- 订单基本信息 -->
                  <div class="detail-grid">
                    <div><span class="label">订单编号：</span>{{ order.order_no }}</div>
                    <div><span class="label">顾客姓名：</span>{{ order.customer_name }}</div>
                    <div><span class="label">联系电话：</span>{{ order.customer_phone || '暂无' }}</div>
                    <div><span class="label">支付方式：</span>{{ payMethodText(order.pay_method) }}</div>
                    <div><span class="label">提货方式：</span>{{ order.delivery_type === 'delivery' ? '送货上门' : '自行提货' }}</div>
                    <div v-if="order.delivery_type === 'delivery' && order.address">
                      <span class="label">收货地址：</span>{{ order.address }}
                    </div>
                  </div>

                  <!-- 订单商品明细 -->
                  <h4>商品明细</h4>
                  <table class="items-table">
                    <thead>
                      <tr>
                        <th>商品名称</th>
                        <th>单价</th>
                        <th>数量</th>
                        <th>小计</th>
                      </tr>
                    </thead>
                    <tbody>
                      <template v-if="detailItems[order.id]?.length">
                        <tr v-for="item in detailItems[order.id]" :key="item.id">
                          <td>{{ item.product_name }}</td>
                          <td>{{ formatPrice(item.price) }}</td>
                          <td>{{ item.quantity }}</td>
                          <td>{{ formatPrice(item.price * item.quantity) }}</td>
                        </tr>
                      </template>
                      <tr v-else>
                        <td colspan="4" class="loading-text">加载中...</td>
                      </tr>
                    </tbody>
                  </table>

                  <!-- 物流信息 -->
                  <LogisticsInfo v-if="order.express_company" :order="order" />
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <Pagination
        :currentPage="page"
        :pageSize="pageSize"
        :total="total"
        @change="p => { page = p; fetchOrders(); }"
      />
    </template>

    <!-- 出库确认对话框 -->
    <ConfirmDialog
      :visible="showShipDialog"
      :title="'确认出库'"
      :message="shipMessage"
      @confirm="handleShip"
      @cancel="showShipDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getWarehouseOrders, getOrderDetail } from '@/api/order';
import { stockOutBatch } from '@/api/inventory';
import Pagination from '@/components/common/Pagination.vue';
import OrderStatusTag from '@/components/order/OrderStatusTag.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import LogisticsInfo from '@/components/order/LogisticsInfo.vue';
import { formatPrice, formatDate } from '@/utils/format';

// 列表状态
const orders = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const statusFilter = ref('paid');

// 展开状态
const expandedId = ref(null);
const detailItems = ref({});

// 消息状态
const errMsg = ref('');
const successMsg = ref('');

// 出库对话框
const showShipDialog = ref(false);
const pendingShipOrder = ref(null);
const shipMessage = ref('');

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

function search() {
  page.value = 1;
  fetchOrders();
}

async function toggleDetail(orderId) {
  if (expandedId.value === orderId) {
    expandedId.value = null;
    return;
  }
  expandedId.value = orderId;
  // 懒加载订单明细
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
  // paid 状态或 pending+cod 可出库
  return order.status === 'paid' ||
    (order.status === 'pending' && order.pay_method === 'cod');
}

function confirmShip(order) {
  pendingShipOrder.value = order;
  shipMessage.value = `确定要对订单 ${order.order_no}（顾客：${order.customer_name}）执行出库操作吗？`;
  showShipDialog.value = true;
}

async function handleShip() {
  const order = pendingShipOrder.value;
  if (!order) return;
  showShipDialog.value = false;
  errMsg.value = '';
  successMsg.value = '';
  try {
    const res = await stockOutBatch(order.order_no);
    if (res.code === 200) {
      successMsg.value = `订单 ${order.order_no} 出库成功`;
      pendingShipOrder.value = null;
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
.page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
}

h2 {
  margin: 0 0 16px;
  font-size: 20px;
}

/* 筛选栏 */
.filter-bar {
  margin-bottom: 16px;
}
.filter-bar select {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  background: #fff;
  min-width: 140px;
}

/* 提示信息 */
.err-msg {
  background: #fff2f0;
  color: #ff4d4f;
  border: 1px solid #ffccc7;
  padding: 10px 14px;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 13px;
}
.success-msg {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
  padding: 10px 14px;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 13px;
}

/* 加载/空状态 */
.loading, .empty {
  text-align: center;
  padding: 48px 0;
  color: #999;
  font-size: 14px;
}

/* 表格 */
.data-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  font-size: 13px;
}
.data-table th {
  background: #fafafa;
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 600;
  white-space: nowrap;
}
.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}

/* 操作列 */
.actions {
  white-space: nowrap;
}
.btn-detail {
  background: none;
  border: 1px solid #1890ff;
  color: #1890ff;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-right: 6px;
}
.btn-detail:hover {
  background: #e6f7ff;
}
.btn-ship {
  background: #1890ff;
  border: none;
  color: #fff;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}
.btn-ship:hover {
  background: #40a9ff;
}

/* 展开详情行 */
.detail-row td {
  padding: 0;
  background: #fafafa;
}
.detail-card {
  padding: 16px 20px;
}
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;
  font-size: 13px;
}
.detail-grid .label {
  color: #999;
}
.detail-card h4 {
  margin: 0 0 8px;
  font-size: 14px;
}

/* 商品明细子表 */
.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  margin-bottom: 12px;
}
.items-table th {
  background: #f5f5f5;
  padding: 6px 10px;
  text-align: left;
  border-bottom: 1px solid #e8e8e8;
}
.items-table td {
  padding: 6px 10px;
  border-bottom: 1px solid #f0f0f0;
}
.loading-text {
  text-align: center;
  color: #999;
  padding: 12px 0;
}
</style>
