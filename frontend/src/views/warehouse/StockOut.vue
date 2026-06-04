<template>
  <div class="stock-out-page">
    <h2>商品出库</h2>
    <el-card class="form-card">
      <el-alert v-if="errMsg" :title="errMsg" type="error" show-icon :closable="false" style="margin-bottom: 16px" />
      <el-alert v-if="successMsg" :title="successMsg" type="success" show-icon :closable="false" style="margin-bottom: 16px" />

      <el-tabs v-model="mode" type="border-card">
        <el-tab-pane label="关联订单出库" name="order">
          <el-form label-width="100px">
            <el-form-item label="关联订单号">
              <el-input v-model="orderNo" placeholder="输入订单号搜索..." @keyup.enter="searchOrder" />
            </el-form-item>
            <el-form-item>
              <el-button @click="searchOrder" type="primary" plain>搜索</el-button>
            </el-form-item>
          </el-form>
          <div v-if="linkedOrder" class="order-info">
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="订单号">{{ linkedOrder.order_no }}</el-descriptions-item>
              <el-descriptions-item label="顾客">{{ linkedOrder.customer_name }}</el-descriptions-item>
              <el-descriptions-item label="状态">{{ linkedOrder.status }}</el-descriptions-item>
              <el-descriptions-item label="金额">{{ formatPrice(linkedOrder.total_amount) }}</el-descriptions-item>
            </el-descriptions>
            <div v-if="linkedOrder.items" style="margin: 12px 0">
              <el-tag v-for="item in linkedOrder.items" :key="item.id" style="margin: 4px">{{ item.product_name }} × {{ item.quantity }}</el-tag>
            </div>
            <el-button type="primary" @click="handleBatchOut" :loading="submitting" style="width: 100%">确认批量出库</el-button>
          </div>
        </el-tab-pane>

        <el-tab-pane label="手动出库" name="manual">
          <el-form label-width="100px">
            <el-form-item label="商品" required>
              <el-select
                v-model="selectedProductId"
                filterable
                remote
                :remote-method="onProductSearch"
                :loading="prodSearching"
                placeholder="输入商品名称搜索..."
                style="width: 100%"
                @change="onProductSelect"
              >
                <el-option v-for="p in productResults" :key="p.id" :label="`${p.name} (库存: ${p.stockQuantity || 0})`" :value="p.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="出库数量" required>
              <el-input-number v-model="manualQty" :min="1" style="width: 100%" />
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="manualRemark" placeholder="如：报损（选填）" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleManualOut" :loading="submitting" style="width: 100%">确认出库</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
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
    if (res.code === 200) { linkedOrder.value = res.data; }
    else { errMsg.value = res.message || '订单不存在'; }
  } catch (err) { errMsg.value = err.message || '订单不存在'; }
}

async function handleBatchOut() {
  if (!linkedOrder.value) return;
  submitting.value = true;
  try {
    const res = await stockOutBatch(linkedOrder.value.order_no);
    if (res.code === 200) { successMsg.value = '出库成功！'; setTimeout(() => router.push('/warehouse'), 1000); }
    else { errMsg.value = res.message || '出库失败'; }
  } catch (err) { errMsg.value = err.message || '操作失败'; }
  finally { submitting.value = false; }
}

// Manual mode
const productResults = ref([]);
const selectedProductId = ref(null);
const selectedProduct = ref(null);
const manualQty = ref(1);
const manualRemark = ref('');
const prodSearching = ref(false);
let searchTimer = null;

function onProductSearch(query) {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    if (!query.trim()) { productResults.value = []; return; }
    prodSearching.value = true;
    try {
      const res = await getProducts({ keyword: query.trim(), pageSize: 10 });
      if (res.code === 200) productResults.value = res.data.list;
    } catch { /* ignore */ }
    finally { prodSearching.value = false; }
  }, 300);
}

function onProductSelect(val) {
  selectedProduct.value = productResults.value.find(p => p.id === val);
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
    const res = await stockOut({ productId: selectedProduct.value.id, quantity: manualQty.value, remark: manualRemark.value });
    if (res.code === 200) { successMsg.value = '出库成功！'; setTimeout(() => router.push('/warehouse'), 1000); }
    else { errMsg.value = res.message || '出库失败'; }
  } catch (err) { errMsg.value = err.message || '操作失败'; }
  finally { submitting.value = false; }
}
</script>

<style scoped>
.stock-out-page { max-width: 600px; margin: 0 auto; padding: 24px; }
.stock-out-page h2 { margin-bottom: 20px; }
.order-info { margin-top: 12px; }
</style>
