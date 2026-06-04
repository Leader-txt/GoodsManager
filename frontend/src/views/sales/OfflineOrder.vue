<template>
  <div class="offline-order">
    <h2>创建线下订单</h2>

    <!-- 步骤指示 -->
    <div class="steps-bar">
      <div class="step" :class="{ active: step >= 1, done: step > 1 }">1. 选择顾客</div>
      <div class="step-arrow">→</div>
      <div class="step" :class="{ active: step >= 2, done: step > 2 }">2. 添加商品</div>
      <div class="step-arrow">→</div>
      <div class="step" :class="{ active: step >= 3, done: step > 3 }">3. 确认提交</div>
    </div>

    <div v-if="errMsg" class="err-msg">{{ errMsg }}</div>

    <!-- 步骤1: 选择顾客 -->
    <div v-if="step === 1" class="step-content">
      <div class="search-box">
        <input v-model="custKeyword" @input="onSearchInput" type="text" placeholder="搜索顾客（姓名/手机号/身份证号）..." class="search-input" />
      </div>
      <div v-if="custLoading" class="loading">搜索中...</div>
      <div v-else-if="customers.length > 0" class="customer-list">
        <div v-for="c in customers" :key="c.id" class="customer-item" @click="selectCustomer(c)">
          <div class="cust-info">
            <strong>{{ c.real_name }}</strong>
            <span class="cust-gender">{{ c.gender }}</span>
            <span class="cust-meta">手机: {{ c.phone || '未填写' }}</span>
            <span class="cust-meta">身份证: {{ c.id_card.slice(0, 6) }}****</span>
          </div>
          <button class="btn-select">选择</button>
        </div>
      </div>
      <div v-else-if="custKeyword && !custLoading" class="empty-tip">
        未找到顾客，<router-link to="/sales/register">去注册新顾客 →</router-link>
      </div>
      <router-link v-if="!custKeyword" to="/sales/register" class="new-customer-link">+ 注册新顾客</router-link>
    </div>

    <!-- 步骤2: 添加商品 -->
    <div v-if="step === 2" class="step-content">
      <div class="search-box">
        <input v-model="prodKeyword" @input="onProdSearch" type="text" placeholder="搜索商品..." class="search-input" />
      </div>
      <div v-if="prodLoading" class="loading">搜索中...</div>
      <div v-else class="product-list">
        <div v-for="p in products" :key="p.id" class="product-item">
          <img :src="p.image_url || '/placeholder.png'" class="prod-img" />
          <div class="prod-info">
            <strong>{{ p.name }}</strong>
            <span class="prod-price">{{ formatPrice(p.price) }}</span>
            <span :class="p.stockQuantity > 0 ? 'in-stock' : 'out-stock'">库存: {{ p.stockQuantity || 0 }}</span>
          </div>
          <div class="prod-action">
            <button @click="qtyMap[p.id] = Math.max(1, (qtyMap[p.id] || 0) - 1)" :disabled="!qtyMap[p.id]">-</button>
            <span class="qty-display">{{ qtyMap[p.id] || 0 }}</span>
            <button @click="qtyMap[p.id] = Math.min(p.stockQuantity, (qtyMap[p.id] || 0) + 1)" :disabled="(qtyMap[p.id] || 0) >= p.stockQuantity">+</button>
          </div>
        </div>
      </div>
      <div class="step-actions">
        <button @click="step = 1" class="btn-back">← 返回选择顾客</button>
        <button @click="goToStep3" class="btn-next" :disabled="totalItems === 0">下一步（已选 {{ totalItems }} 件）</button>
      </div>
    </div>

    <!-- 步骤3: 确认提交 -->
    <div v-if="step === 3" class="step-content">
      <div class="summary-card">
        <h3>订单确认</h3>
        <p><span class="lbl">顾客：</span>{{ selectedCustomer.real_name }} ({{ selectedCustomer.phone || '无手机号' }})</p>

        <table class="item-table">
          <thead><tr><th>商品</th><th>单价</th><th>数量</th><th>小计</th></tr></thead>
          <tbody>
            <tr v-for="item in selectedItems" :key="item.productId">
              <td>{{ item.productName }}</td>
              <td>{{ formatPrice(item.price) }}</td>
              <td>{{ item.quantity }}</td>
              <td class="subtotal">{{ formatPrice(item.price * item.quantity) }}</td>
            </tr>
          </tbody>
        </table>
        <div class="total-line">合计：<strong>{{ formatPrice(totalAmount) }}</strong></div>
      </div>

      <div class="form-group">
        <label>提货方式</label>
        <div class="radio-group">
          <label class="radio-label"><input v-model="deliveryType" type="radio" value="self_pickup" /> 自行提货</label>
          <label class="radio-label"><input v-model="deliveryType" type="radio" value="delivery" /> 送货上门</label>
        </div>
      </div>

      <div v-if="deliveryType === 'delivery'" class="delivery-form">
        <div class="form-group">
          <label>收货地址 <span class="required">*</span></label>
          <input v-model="address" type="text" placeholder="请输入详细收货地址" />
        </div>
        <div class="form-group">
          <label>快递公司 <span class="required">*</span></label>
          <input v-model="expressCompany" type="text" placeholder="如：顺丰速运" />
        </div>
        <div class="form-group">
          <label>快递单号 <span class="required">*</span></label>
          <input v-model="expressNo" type="text" placeholder="请输入快递单号" />
        </div>
      </div>

      <div class="step-actions">
        <button @click="step = 2" class="btn-back">← 返回修改</button>
        <button @click="handleSubmit" :disabled="submitting" class="btn-submit">
          {{ submitting ? '提交中...' : '确认提交（现场结付）' }}
        </button>
      </div>
    </div>
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

// Step 1: Customer selection
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

function selectCustomer(c) {
  selectedCustomer.value = c;
  errMsg.value = '';
  step.value = 2;
}

// Step 2: Product selection
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
        // Init qtyMap for new products
        res.data.list.forEach(p => {
          if (!(p.id in qtyMap)) qtyMap[p.id] = 0;
        });
      }
    } finally { prodLoading.value = false; }
  }, 300);
}
// Initial product load
onProdSearch();

const totalItems = computed(() => Object.values(qtyMap).reduce((s, v) => s + v, 0));

const selectedItems = computed(() => {
  return Object.entries(qtyMap)
    .filter(([, qty]) => qty > 0)
    .map(([pid, qty]) => {
      const p = products.value.find(p => p.id === parseInt(pid));
      return p ? { productId: p.id, productName: p.name, price: p.price, quantity: qty } : null;
    })
    .filter(Boolean);
});

const totalAmount = computed(() => selectedItems.value.reduce((s, i) => s + i.price * i.quantity, 0));

function goToStep3() {
  errMsg.value = '';
  if (selectedItems.value.length === 0) {
    errMsg.value = '请至少选择一件商品';
    return;
  }
  step.value = 3;
}

// Step 3: Delivery & submit
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
    if (res.code === 200) {
      router.push(`/orders/${res.data.orderId}`);
    } else {
      errMsg.value = res.message || '提交失败';
    }
  } catch (err) {
    errMsg.value = err.message || '操作失败';
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.offline-order { max-width: 900px; margin: 0 auto; padding: 24px; }
.offline-order h2 { margin-bottom: 20px; }
.steps-bar { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 24px; }
.step { padding: 8px 20px; background: #f5f5f5; border-radius: 20px; font-size: 14px; color: #999; }
.step.active { background: #e6f7ff; color: #1890ff; font-weight: bold; }
.step.done { background: #f6ffed; color: #52c41a; }
.step-arrow { color: #ccc; }
.err-msg { background: #fff2f0; color: #ff4d4f; padding: 10px 14px; border-radius: 4px; margin-bottom: 16px; font-size: 13px; border: 1px solid #ffccc7; }
.step-content { background: #fff; padding: 20px; border-radius: 8px; }
.search-box { margin-bottom: 16px; }
.search-input { width: 100%; padding: 10px 14px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 14px; box-sizing: border-box; }
.search-input:focus { border-color: #1890ff; outline: none; }
.loading, .empty-tip { text-align: center; padding: 30px; color: #999; font-size: 14px; }
.customer-list, .product-list { display: flex; flex-direction: column; gap: 8px; }
.customer-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border: 1px solid #f0f0f0; border-radius: 4px; }
.customer-item:hover { border-color: #1890ff; background: #fafafa; }
.cust-info { display: flex; align-items: center; gap: 12px; font-size: 14px; }
.cust-gender { color: #666; }
.cust-meta { color: #999; font-size: 12px; }
.btn-select { padding: 6px 16px; background: #1890ff; color: #fff; border: none; border-radius: 4px; font-size: 13px; }
.product-item { display: flex; align-items: center; gap: 16px; padding: 10px; border: 1px solid #f0f0f0; border-radius: 4px; }
.prod-img { width: 60px; height: 60px; object-fit: contain; background: #f5f5f5; border-radius: 4px; }
.prod-info { flex: 1; display: flex; flex-direction: column; gap: 4px; font-size: 14px; }
.prod-price { color: #ff4d4f; font-weight: bold; }
.in-stock { color: #52c41a; font-size: 12px; }
.out-stock { color: #ff4d4f; font-size: 12px; }
.prod-action { display: flex; align-items: center; gap: 6px; }
.prod-action button { width: 28px; height: 28px; border: 1px solid #d9d9d9; background: #fff; border-radius: 4px; font-size: 16px; line-height: 1; }
.prod-action button:hover { border-color: #1890ff; color: #1890ff; }
.prod-action button:disabled { background: #f5f5f5; color: #ccc; }
.qty-display { min-width: 24px; text-align: center; font-weight: bold; }
.step-actions { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 16px; border-top: 1px solid #f0f0f0; }
.btn-back { padding: 8px 16px; background: #fff; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 14px; color: #666; }
.btn-next, .btn-submit { padding: 10px 24px; background: #1890ff; color: #fff; border: none; border-radius: 4px; font-size: 15px; }
.btn-next:disabled, .btn-submit:disabled { background: #ccc; }
.new-customer-link { display: block; text-align: center; color: #1890ff; font-size: 14px; padding: 16px; }
.summary-card { border: 1px solid #f0f0f0; border-radius: 4px; padding: 16px; margin-bottom: 20px; }
.summary-card h3 { margin-bottom: 12px; }
.summary-card p { margin-bottom: 8px; font-size: 14px; }
.lbl { color: #999; }
.item-table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
.item-table th, .item-table td { padding: 8px; text-align: left; border-bottom: 1px solid #f0f0f0; }
.subtotal { color: #ff4d4f; font-weight: bold; }
.total-line { text-align: right; font-size: 16px; }
.total-line strong { color: #ff4d4f; font-size: 20px; }
.form-group { margin-bottom: 14px; }
.form-group label { display: block; margin-bottom: 4px; font-size: 14px; }
.required { color: #ff4d4f; }
.form-group input[type="text"] { width: 100%; padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 14px; box-sizing: border-box; }
.radio-group { display: flex; gap: 24px; }
.radio-label { font-size: 14px; display: flex; align-items: center; gap: 4px; }
.delivery-form { background: #fafafa; padding: 16px; border-radius: 4px; margin-top: 12px; }
</style>
