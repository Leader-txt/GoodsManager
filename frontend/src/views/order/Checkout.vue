<template>
  <div class="checkout-page">
    <h2>确认订单</h2>
    <div v-if="cartStore.selectedItems.length === 0" class="empty">没有选中的商品，请先添加商品到购物车</div>
    <div v-else class="checkout-content">
      <!-- 收货地址 -->
      <section class="section">
        <h3>收货地址</h3>
        <div class="addr-option">
          <label><input type="radio" v-model="useNewAddr" :value="false" /> 默认地址：{{ profile?.address || '未设置' }}</label>
        </div>
        <div class="addr-option">
          <label><input type="radio" v-model="useNewAddr" :value="true" /> 新地址：</label>
          <input v-if="useNewAddr" v-model="newAddress" placeholder="请输入收货地址" class="addr-input" />
        </div>
      </section>

      <!-- 商品清单 -->
      <section class="section">
        <h3>商品清单</h3>
        <div v-for="item in cartStore.selectedItems" :key="item.id" class="checkout-item">
          <span class="item-name">{{ item.productName }} ×{{ item.quantity }}</span>
          <span class="item-price">{{ formatPrice(item.price * item.quantity) }}</span>
        </div>
        <div class="total-row">合计：<strong>{{ formatPrice(cartStore.totalAmount) }}</strong></div>
      </section>

      <!-- 支付与提货方式 -->
      <section class="section">
        <h3>支付方式</h3>
        <label class="radio-block"><input type="radio" v-model="payMethod" value="online" /> 在线支付</label>
        <label class="radio-block"><input type="radio" v-model="payMethod" value="cod" /> 货到付款</label>

        <h3 style="margin-top:16px">提货方式</h3>
        <label class="radio-block"><input type="radio" v-model="deliveryType" value="delivery" /> 送货上门</label>
        <label class="radio-block"><input type="radio" v-model="deliveryType" value="self_pickup" /> 自行提货</label>
      </section>

      <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
      <button @click="submitOrder" :disabled="submitting" class="btn-submit">
        {{ submitting ? '提交中...' : '提交订单' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';
import { getProfile } from '@/api/user';
import { createOrder } from '@/api/order';
import { formatPrice } from '@/utils/format';

const router = useRouter();
const cartStore = useCartStore();
const auth = useAuthStore();

const profile = ref(null);
const useNewAddr = ref(false);
const newAddress = ref('');
const payMethod = ref('online');
const deliveryType = ref('delivery');
const errorMsg = ref('');
const submitting = ref(false);

async function submitOrder() {
  errorMsg.value = '';
  if (!cartStore.selectedItems.length) { errorMsg.value = '购物车为空'; return; }
  const addr = useNewAddr.value ? newAddress.value : profile.value?.address;
  if (deliveryType.value === 'delivery' && !addr) { errorMsg.value = '请填写收货地址'; return; }

  submitting.value = true;
  try {
    const res = await createOrder({
      cartItemIds: cartStore.selectedItems.map(i => i.id),
      address: addr,
      payMethod: payMethod.value,
      deliveryType: deliveryType.value,
    });
    if (res.code === 200) {
      cartStore.clearSelected();
      router.push(`/orders/${res.data.orderId}`);
    }
  } catch (err) {
    errorMsg.value = err.message || '提交失败';
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  try {
    const res = await getProfile();
    if (res.code === 200) profile.value = res.data;
  } catch { /* ignore */ }
});
</script>

<style scoped>
.checkout-page { max-width: 700px; margin: 0 auto; }
.section { background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 16px; }
.section h3 { margin-bottom: 12px; font-size: 15px; color: #333; }
.addr-option { margin-bottom: 8px; }
.addr-input { width: 100%; padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px; margin-top: 4px; }
.checkout-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
.total-row { text-align: right; padding: 12px 0; }
.total-row strong { color: #ff4d4f; font-size: 20px; }
.radio-block { display: block; margin-bottom: 8px; cursor: pointer; }
.error-msg { color: #ff4d4f; margin-bottom: 12px; text-align: center; }
.btn-submit { width: 100%; padding: 14px; background: #ff4d4f; color: #fff; border: none; border-radius: 6px; font-size: 18px; }
.btn-submit:hover { background: #ff7875; }
.btn-submit:disabled { background: #ccc; cursor: not-allowed; }
.empty { text-align: center; padding: 60px; color: #999; }
</style>
