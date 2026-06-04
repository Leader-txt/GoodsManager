<template>
  <div class="checkout-page">
    <h2>确认订单</h2>
    <el-empty v-if="cartStore.selectedItems.length === 0" description="没有选中的商品，请先添加商品到购物车" />
    <div v-else class="checkout-content">
      <el-card class="section">
        <template #header><h3>收货地址</h3></template>
        <el-radio-group v-model="useNewAddr">
          <el-radio :value="false">默认地址：{{ profile?.address || '未设置' }}</el-radio>
          <el-radio :value="true">新地址：</el-radio>
        </el-radio-group>
        <el-input v-if="useNewAddr" v-model="newAddress" placeholder="请输入收货地址" style="margin-top: 8px" />
      </el-card>

      <el-card class="section">
        <template #header><h3>商品清单</h3></template>
        <div v-for="item in cartStore.selectedItems" :key="item.id" class="checkout-item">
          <span>{{ item.productName }} ×{{ item.quantity }}</span>
          <span class="item-price">{{ formatPrice(item.price * item.quantity) }}</span>
        </div>
        <div class="total-row">合计：<strong>{{ formatPrice(cartStore.totalAmount) }}</strong></div>
      </el-card>

      <el-card class="section">
        <template #header><h3>支付与提货方式</h3></template>
        <el-form label-width="80px">
          <el-form-item label="支付方式">
            <el-radio-group v-model="payMethod">
              <el-radio value="online">在线支付</el-radio>
              <el-radio value="cod">货到付款</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="提货方式">
            <el-radio-group v-model="deliveryType">
              <el-radio value="delivery">送货上门</el-radio>
              <el-radio value="self_pickup">自行提货</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </el-card>

      <el-alert v-if="errorMsg" :title="errorMsg" type="error" show-icon :closable="false" style="margin-bottom: 12px" />
      <el-button type="danger" @click="submitOrder" :loading="submitting" size="large" style="width: 100%">{{ submitting ? '提交中...' : '提交订单' }}</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '@/stores/cart';
import { getProfile } from '@/api/user';
import { createOrder } from '@/api/order';
import { formatPrice } from '@/utils/format';

const router = useRouter();
const cartStore = useCartStore();
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
  } catch (err) { errorMsg.value = err.message || '提交失败'; }
  finally { submitting.value = false; }
}

onMounted(async () => {
  try { const res = await getProfile(); if (res.code === 200) profile.value = res.data; } catch { /* ignore */ }
});
</script>

<style scoped>
.checkout-page { max-width: 700px; margin: 0 auto; }
.section { margin-bottom: 16px; }
.section h3 { margin: 0; font-size: 15px; }
.checkout-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
.item-price { color: #ff4d4f; font-weight: bold; }
.total-row { text-align: right; padding: 12px 0; }
.total-row strong { color: #ff4d4f; font-size: 20px; }
</style>
