<template>
  <div class="stock-out-page"><h2>商品出库</h2>
    <div class="form-card">
      <div v-if="errMsg" class="err-msg">{{ errMsg }}</div>
      <div v-if="successMsg" class="success-msg">{{ successMsg }}</div>

      <!-- 模式切换 -->
      <div class="mode-tabs">
        <button :class="{ active: mode === 'order' }" @click="mode = 'order'">关联订单出库</button>
        <button :class="{ active: mode === 'manual' }" @click="mode = 'manual'">手动出库</button>
      </div>

      <!-- 关联订单模式 -->
      <div v-if="mode === 'order'" class="form-group">
        <label>关联订单号</label>
        <input v-model="orderNo" @keyup.enter="searchOrder" type="text" placeholder="输入订单号搜索..." class="input-full" />
        <button @click="searchOrder" class="btn-search">搜索</button>
        <div v-if="linkedOrder" class="order-info">
          <p><strong>订单号：</strong>{{ linkedOrder.order_no }}</p>
          <p><strong>顾客：</strong>{{ linkedOrder.customer_name }}</p>
          <p><strong>状态：</strong>{{ linkedOrder.status }}</p>
          <p><strong>金额：</strong>{{ formatPrice(linkedOrder.total_amount) }}</p>
          <div v-if="linkedOrder.items" class="order-items">
            <div v-for="item in linkedOrder.items" :key="item.id" class="oi-row">
              <span>{{ item.product_name }} × {{ item.quantity }}</span>
            </div>
          </div>
          <button @click="handleBatchOut" :disabled="submitting" class="btn-out">确认批量出库</button>
        </div>
      </div>

      <!-- 手动出库模式 -->
      <div v-if="mode === 'manual'">
        <div class="form-group">
          <label>商品 <span class="required">*</span></label>
          <div class="search-wrapper">
            <input v-model="productKeyword" @input="onProductSearch" type="text" placeholder="输入商品名称搜索..." class="input-full" />
            <div v-if="productResults.length && showResults" class="dropdown">
              <div v-for="p in productResults" :key="p.id" class="dropdown-item" @click="selectProduct(p)">
                {{ p.name }} (库存: {{ p.stockQuantity || 0 }})
              </div>
            </div>
          </div>
          <div v-if="selectedProduct" class="selected-tag">{{ selectedProduct.name }} (库存: {{ selectedProduct.stockQuantity }})</div>
        </div>
        <div class="form-group">
          <label>出库数量 <span class="required">*</span></label>
          <input v-model.number="manualQty" type="number" min="1" placeholder="请输入出库数量" class="input-full" />
        </div>
        <div class="form-group">
          <label>备注</label>
          <input v-model="manualRemark" type="text" placeholder="如：报损（选填）" class="input-full" />
        </div>
        <button @click="handleManualOut" :disabled="submitting" class="btn-submit">确认出库</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { stockOut, stockOutBatch } from '@/api/inventory';
import { getProducts } from '@/api/product';
import { getOrderByOrderNo } from '@/api/order';
import { formatPrice } from '@/utils/format';

const router = useRouter();
const mode = ref('order');
const errMsg = ref('');
const successMsg = ref('');
const submitting = ref(false);

// Order-linked mode
const orderNo = ref('');
const linkedOrder = ref(null);

async function searchOrder() {
  errMsg.value = '';
  if (!orderNo.value.trim()) { errMsg.value = '请输入订单号'; return; }
  try {
    const res = await getOrderByOrderNo(orderNo.value.trim());
    if (res.code === 200) {
      linkedOrder.value = res.data;
    } else { errMsg.value = res.message || '订单不存在'; }
  } catch (err) { errMsg.value = err.message || '订单不存在'; }
}

async function handleBatchOut() {
  if (!linkedOrder.value) return;
  submitting.value = true;
  try {
    const res = await stockOutBatch(linkedOrder.value.order_no);
    if (res.code === 200) {
      successMsg.value = '出库成功！';
      setTimeout(() => router.push('/warehouse'), 1000);
    } else { errMsg.value = res.message || '出库失败'; }
  } catch (err) { errMsg.value = err.message || '操作失败'; }
  finally { submitting.value = false; }
}

// Manual mode
const productKeyword = ref('');
const productResults = ref([]);
const showResults = ref(false);
const selectedProduct = ref(null);
const manualQty = ref(1);
const manualRemark = ref('');
let searchTimer = null;

function onProductSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    if (!productKeyword.value.trim()) { productResults.value = []; showResults.value = false; return; }
    try {
      const res = await getProducts({ keyword: productKeyword.value.trim(), pageSize: 10 });
      if (res.code === 200) { productResults.value = res.data.list; showResults.value = true; }
    } catch { /* ignore */ }
  }, 300);
}

function selectProduct(p) {
  selectedProduct.value = p;
  productKeyword.value = p.name;
  showResults.value = false;
}

async function handleManualOut() {
  errMsg.value = '';
  if (!selectedProduct.value) { errMsg.value = '请选择商品'; return; }
  if (!manualQty.value || manualQty.value < 1) { errMsg.value = '出库数量必须大于0'; return; }
  if (manualQty.value > (selectedProduct.value.stockQuantity || 0)) {
    errMsg.value = `出库数量(${manualQty.value})超过当前库存(${selectedProduct.value.stockQuantity})`;
    return;
  }

  submitting.value = true;
  try {
    const res = await stockOut({
      productId: selectedProduct.value.id,
      quantity: manualQty.value,
      remark: manualRemark.value,
    });
    if (res.code === 200) {
      successMsg.value = '出库成功！';
      setTimeout(() => router.push('/warehouse'), 1000);
    } else { errMsg.value = res.message || '出库失败'; }
  } catch (err) { errMsg.value = err.message || '操作失败'; }
  finally { submitting.value = false; }
}
</script>

<style scoped>
.stock-out-page { max-width: 600px; margin: 0 auto; padding: 24px; }
.stock-out-page h2 { margin-bottom: 20px; }
.form-card { background: #fff; padding: 24px; border-radius: 8px; }
.err-msg { background: #fff2f0; color: #ff4d4f; padding: 10px 14px; border-radius: 4px; margin-bottom: 16px; font-size: 13px; border: 1px solid #ffccc7; }
.success-msg { background: #f6ffed; color: #52c41a; padding: 10px 14px; border-radius: 4px; margin-bottom: 16px; font-size: 13px; border: 1px solid #b7eb8f; }
.mode-tabs { display: flex; gap: 0; margin-bottom: 20px; border-bottom: 2px solid #f0f0f0; }
.mode-tabs button { flex: 1; padding: 10px; background: none; border: none; font-size: 14px; color: #999; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; }
.mode-tabs button.active { color: #1890ff; border-bottom-color: #1890ff; font-weight: bold; }
.form-group { margin-bottom: 14px; }
.form-group label { display: block; margin-bottom: 6px; font-size: 14px; color: #333; }
.required { color: #ff4d4f; }
.input-full, .search-wrapper input { width: 100%; padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 14px; box-sizing: border-box; }
.input-full:focus, .search-wrapper input:focus { border-color: #1890ff; outline: none; }
.search-wrapper { position: relative; }
.dropdown { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #d9d9d9; border-radius: 4px; max-height: 200px; overflow-y: auto; z-index: 10; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.dropdown-item { padding: 8px 12px; cursor: pointer; font-size: 13px; }
.dropdown-item:hover { background: #e6f7ff; }
.selected-tag { margin-top: 6px; padding: 4px 10px; background: #e6f7ff; color: #1890ff; border-radius: 4px; font-size: 13px; display: inline-block; }
.btn-search { margin-top: 8px; padding: 8px 16px; background: #f0f0f0; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 13px; color: #666; }
.order-info { margin-top: 12px; padding: 16px; background: #fafafa; border-radius: 4px; }
.order-info p { margin-bottom: 6px; font-size: 14px; }
.order-items { margin: 8px 0; }
.oi-row { padding: 4px 0; font-size: 13px; color: #666; }
.btn-out, .btn-submit { padding: 10px 24px; background: #1890ff; color: #fff; border: none; border-radius: 4px; font-size: 15px; margin-top: 8px; width: 100%; }
.btn-out:disabled, .btn-submit:disabled { background: #ccc; }
</style>
