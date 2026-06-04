<template>
  <div class="cart-page">
    <h2>购物车</h2>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="cartStore.items.length === 0" class="empty">
      <p>购物车是空的</p>
      <router-link to="/products">去逛逛</router-link>
    </div>
    <div v-else class="cart-content">
      <div class="cart-header">
        <label><input type="checkbox" :checked="allSelected" @change="cartStore.toggleSelectAll()" /> 全选</label>
      </div>
      <div v-for="item in cartStore.items" :key="item.id" class="cart-item" :class="{ outofstock: item.stockQuantity === 0 }">
        <input type="checkbox" :checked="item.selected" @change="cartStore.toggleSelect(item.id)" />
        <img :src="item.productImage || '/placeholder.png'" class="item-img" />
        <div class="item-info">
          <div class="item-name">{{ item.productName }}</div>
          <div class="item-price">{{ formatPrice(item.price) }}</div>
        </div>
        <div class="item-quantity">
          <button @click="decrease(item)" :disabled="item.quantity <= 1">-</button>
          <span>{{ item.quantity }}</span>
          <button @click="increase(item)" :disabled="item.quantity >= item.stockQuantity">+</button>
        </div>
        <div class="item-subtotal">{{ formatPrice(item.price * item.quantity) }}</div>
        <button @click="removeItem(item)" class="btn-remove">删除</button>
        <div v-if="item.stockQuantity === 0" class="stock-warn">库存不足</div>
      </div>
      <div class="cart-footer">
        <span>已选 {{ cartStore.selectedItems.length }} 件，合计：<strong>{{ formatPrice(cartStore.totalAmount) }}</strong></span>
        <button @click="goCheckout" :disabled="cartStore.selectedItems.length === 0" class="btn-checkout">去结算</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '@/stores/cart';
import { formatPrice } from '@/utils/format';

const router = useRouter();
const cartStore = useCartStore();
const loading = ref(false);

const allSelected = computed(() => cartStore.items.length > 0 && cartStore.items.every(i => i.selected));

async function loadCart() {
  loading.value = true;
  await cartStore.fetchCart();
  loading.value = false;
}

async function decrease(item) {
  if (item.quantity > 1) await cartStore.updateQuantity(item.id, item.quantity - 1);
}

async function increase(item) {
  if (item.quantity < item.stockQuantity) await cartStore.updateQuantity(item.id, item.quantity + 1);
}

async function removeItem(item) {
  if (confirm('确定删除该商品？')) await cartStore.removeItem(item.id);
}

function goCheckout() {
  router.push('/checkout');
}

onMounted(loadCart);
</script>

<style scoped>
.cart-page { max-width: 900px; margin: 0 auto; }
.cart-content { background: #fff; border-radius: 8px; overflow: hidden; }
.cart-header { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; }
.cart-item { display: flex; align-items: center; padding: 16px; border-bottom: 1px solid #f0f0f0; gap: 12px; position: relative; }
.item-img { width: 80px; height: 80px; object-fit: contain; background: #f5f5f5; border-radius: 4px; }
.item-info { flex: 1; }
.item-name { font-size: 14px; color: #333; }
.item-price { font-size: 13px; color: #999; margin-top: 4px; }
.item-quantity { display: flex; align-items: center; gap: 8px; }
.item-quantity button { width: 28px; height: 28px; border: 1px solid #d9d9d9; background: #fff; border-radius: 4px; font-size: 16px; }
.item-subtotal { font-size: 16px; color: #ff4d4f; font-weight: bold; width: 100px; text-align: right; }
.btn-remove { color: #ff4d4f; background: none; border: none; cursor: pointer; font-size: 13px; }
.stock-warn { position: absolute; bottom: 4px; left: 120px; color: #ff4d4f; font-size: 12px; }
.outofstock { background: #fff2f0; }
.cart-footer { display: flex; justify-content: space-between; align-items: center; padding: 16px; }
.cart-footer strong { color: #ff4d4f; font-size: 20px; }
.btn-checkout { padding: 10px 32px; background: #ff4d4f; color: #fff; border: none; border-radius: 4px; font-size: 16px; }
.btn-checkout:hover { background: #ff7875; }
.btn-checkout:disabled { background: #ccc; cursor: not-allowed; }
.empty, .loading { text-align: center; padding: 60px; color: #999; }
</style>
