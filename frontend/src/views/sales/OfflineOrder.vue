<template>
  <div class="offline-order">
    <h2>创建线下订单</h2>

    <el-steps :active="step - 1" finish-status="success" align-center style="margin-bottom: 24px">
      <el-step title="选择顾客" />
      <el-step title="添加商品" />
      <el-step title="确认提交" />
    </el-steps>

    <el-alert v-if="errMsg" :title="errMsg" type="error" show-icon :closable="false" style="margin-bottom: 16px" />

    <!-- Step 1: 选择顾客 -->
    <el-card v-if="step === 1">
      <el-input v-model="custKeyword" placeholder="搜索顾客（姓名/手机号/身份证号）..." clearable @input="onSearchInput" style="margin-bottom: 16px" />
      <div v-if="custLoading" style="text-align:center;padding:30px;color:#999">搜索中...</div>
      <div v-else-if="customers.length > 0" class="customer-list">
        <div v-for="c in customers" :key="c.id" class="customer-item" @click="selectCustomer(c)">
          <div class="cust-info">
            <strong>{{ c.real_name }}</strong>
            <el-tag size="small">{{ c.gender }}</el-tag>
            <span style="color:#999;font-size:12px">手机: {{ c.phone || '未填写' }}</span>
          </div>
          <el-button type="primary" size="small">选择</el-button>
        </div>
      </div>
      <div v-else-if="custKeyword && !custLoading" style="text-align:center;padding:30px">
        未找到顾客，<router-link to="/sales/register">去注册新顾客 →</router-link>
      </div>
      <router-link v-if="!custKeyword" to="/sales/register" style="display:block;text-align:center;color:#1890ff;padding:16px">+ 注册新顾客</router-link>
    </el-card>

    <!-- Step 2: 添加商品 -->
    <el-card v-if="step === 2">
      <el-input v-model="prodKeyword" placeholder="搜索商品..." clearable @input="onProdSearch" style="margin-bottom: 16px" />
      <div v-if="prodLoading" style="text-align:center;padding:30px;color:#999">搜索中...</div>
      <div v-else class="product-list">
        <div v-for="p in products" :key="p.id" class="product-item">
          <img :src="p.image_url || '/placeholder.png'" class="prod-img" />
          <div class="prod-info">
            <strong>{{ p.name }}</strong>
            <span class="prod-price">{{ formatPrice(p.price) }}</span>
            <el-tag :type="(p.stock_quantity || 0) > 0 ? 'success' : 'danger'" size="small">库存: {{ p.stock_quantity || 0 }}</el-tag>
          </div>
          <div class="prod-action">
            <el-button :disabled="!qtyMap[p.id]" @click="qtyMap[p.id] = Math.max(1, (qtyMap[p.id] || 0) - 1)" size="small" circle>-</el-button>
            <span class="qty-display">{{ qtyMap[p.id] || 0 }}</span>
            <el-button :disabled="(qtyMap[p.id] || 0) >= (p.stock_quantity || 0)" @click="qtyMap[p.id] = Math.min(p.stock_quantity || 0, (qtyMap[p.id] || 0) + 1)" size="small" circle>+</el-button>
          </div>
        </div>
      </div>
      <div class="step-actions">
        <el-button @click="step = 1">← 返回选择顾客</el-button>
        <el-button type="primary" @click="goToStep3" :disabled="totalItems === 0">下一步（已选 {{ totalItems }} 件）</el-button>
      </div>
    </el-card>

    <!-- Step 3: 确认提交 -->
    <el-card v-if="step === 3">
      <template #header><h3>订单确认</h3></template>
      <p>顾客：<strong>{{ selectedCustomer.real_name }}</strong> ({{ selectedCustomer.phone || '无手机号' }})</p>

      <el-table :data="selectedItems" size="small" style="margin: 12px 0">
        <el-table-column prop="productName" label="商品" />
        <el-table-column label="单价" :formatter="(r) => formatPrice(r.price)" />
        <el-table-column prop="quantity" label="数量" />
        <el-table-column label="小计" :formatter="(r) => formatPrice(r.price * r.quantity)" />
      </el-table>
      <div class="total-line">合计：<strong>{{ formatPrice(totalAmount) }}</strong></div>

      <el-form label-width="100px" style="margin-top: 16px">
        <el-form-item label="提货方式">
          <el-radio-group v-model="deliveryType">
            <el-radio value="self_pickup">自行提货</el-radio>
            <el-radio value="delivery">送货上门</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <div v-if="deliveryType === 'delivery'" class="delivery-form">
        <el-form label-width="100px">
          <el-form-item label="收货地址" required><el-input v-model="address" placeholder="请输入详细收货地址" /></el-form-item>
          <el-form-item label="快递公司" required><el-input v-model="expressCompany" placeholder="如：顺丰速运" /></el-form-item>
          <el-form-item label="快递单号" required><el-input v-model="expressNo" placeholder="请输入快递单号" /></el-form-item>
        </el-form>
      </div>

      <div class="step-actions">
        <el-button @click="step = 2">← 返回修改</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确认提交（现场结付）</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { searchCustomers } from '@/api/customer';
import { getProducts } from '@/api/product';
import { createOfflineOrder } from '@/api/order';
import { formatPrice } from '@/utils/format';

const router = useRouter();
const step = ref(1);
const errMsg = ref('');

// Step 1
const custKeyword = ref('');
const customers = ref([]);
const custLoading = ref(false);
const selectedCustomer = ref(null);
let custTimer = null;

function onSearchInput() {
  clearTimeout(custTimer);
  custTimer = setTimeout(async () => {
    if (!custKeyword.value.trim()) { customers.value = []; return; }
    custLoading.value = true;
    try {
      const res = await searchCustomers(custKeyword.value.trim());
      if (res.code === 200) customers.value = res.data;
    } finally { custLoading.value = false; }
  }, 300);
}

function selectCustomer(c) { selectedCustomer.value = c; errMsg.value = ''; step.value = 2; }

// Step 2
const prodKeyword = ref('');
const products = ref([]);
const prodLoading = ref(false);
const qtyMap = reactive({});
let prodTimer = null;

function onProdSearch() {
  clearTimeout(prodTimer);
  prodTimer = setTimeout(async () => {
    prodLoading.value = true;
    try {
      const res = await getProducts({ keyword: prodKeyword.value, pageSize: 50 });
      if (res.code === 200) {
        products.value = res.data.list;
        res.data.list.forEach(p => { if (!(p.id in qtyMap)) qtyMap[p.id] = 0; });
      }
    } finally { prodLoading.value = false; }
  }, 300);
}
onProdSearch();

const totalItems = computed(() => Object.values(qtyMap).reduce((s, v) => s + v, 0));

const selectedItems = computed(() => {
  return Object.entries(qtyMap).filter(([, qty]) => qty > 0).map(([pid, qty]) => {
    const p = products.value.find(p => p.id === parseInt(pid));
    return p ? { productId: p.id, productName: p.name, price: p.price, quantity: qty } : null;
  }).filter(Boolean);
});

const totalAmount = computed(() => selectedItems.value.reduce((s, i) => s + i.price * i.quantity, 0));

function goToStep3() {
  errMsg.value = '';
  if (selectedItems.value.length === 0) { errMsg.value = '请至少选择一件商品'; return; }
  step.value = 3;
}

const deliveryType = ref('self_pickup');
const address = ref('');
const expressCompany = ref('');
const expressNo = ref('');
const submitting = ref(false);

async function handleSubmit() {
  errMsg.value = '';
  if (deliveryType.value === 'delivery') {
    if (!address.value.trim()) { errMsg.value = '请输入收货地址'; return; }
    if (!expressCompany.value.trim()) { errMsg.value = '请输入快递公司'; return; }
    if (!expressNo.value.trim()) { errMsg.value = '请输入快递单号'; return; }
  }

  submitting.value = true;
  try {
    const data = {
      customerId: selectedCustomer.value.id,
      items: selectedItems.value.map(i => ({ productId: i.productId, quantity: i.quantity })),
      deliveryType: deliveryType.value,
    };
    if (deliveryType.value === 'delivery') {
      data.address = address.value.trim();
      data.expressCompany = expressCompany.value.trim();
      data.expressNo = expressNo.value.trim();
    }
    const res = await createOfflineOrder(data);
    if (res.code === 200) { router.push(`/orders/${res.data.orderId}`); }
    else { errMsg.value = res.message || '提交失败'; }
  } catch (err) { errMsg.value = err.message || '操作失败'; }
  finally { submitting.value = false; }
}
</script>

<style scoped>
.offline-order { max-width: 900px; margin: 0 auto; padding: 24px; }
.offline-order h2 { margin-bottom: 20px; }
.customer-list { display: flex; flex-direction: column; gap: 8px; }
.customer-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border: 1px solid #f0f0f0; border-radius: 4px; cursor: pointer; }
.customer-item:hover { border-color: #1890ff; background: #fafafa; }
.cust-info { display: flex; align-items: center; gap: 12px; font-size: 14px; }
.product-list { display: flex; flex-direction: column; gap: 8px; }
.product-item { display: flex; align-items: center; gap: 16px; padding: 10px; border: 1px solid #f0f0f0; border-radius: 4px; }
.prod-img { width: 60px; height: 60px; object-fit: contain; background: #f5f5f5; border-radius: 4px; }
.prod-info { flex: 1; display: flex; flex-direction: column; gap: 4px; font-size: 14px; }
.prod-price { color: #ff4d4f; font-weight: bold; }
.prod-action { display: flex; align-items: center; gap: 8px; }
.qty-display { min-width: 24px; text-align: center; font-weight: bold; }
.step-actions { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 16px; border-top: 1px solid #f0f0f0; }
.total-line { text-align: right; font-size: 16px; }
.total-line strong { color: #ff4d4f; font-size: 20px; }
.delivery-form { background: #fafafa; padding: 16px; border-radius: 4px; margin-top: 4px; }
</style>
