<template>
  <div class="cart-page" v-loading="loading">
    <h2>购物车</h2>
    <el-empty v-if="!loading && cartStore.items.length === 0" description="购物车是空的">
      <el-button type="primary" @click="$router.push('/products')">去逛逛</el-button>
    </el-empty>
    <div v-else-if="cartStore.items.length > 0" class="cart-content">
      <el-card class="cart-card">
        <div class="cart-header">
          <el-checkbox :model-value="allSelected" @change="cartStore.toggleSelectAll()">全选</el-checkbox>
        </div>
        <div v-for="item in cartStore.items" :key="item.id" class="cart-item" :class="{ outofstock: item.stockQuantity === 0 }">
          <el-checkbox :model-value="item.selected" @change="cartStore.toggleSelect(item.id)" />
          <img :src="item.productImage || '/placeholder.png'" class="item-img" />
          <div class="item-info">
            <div class="item-name">{{ item.productName }}</div>
            <div class="item-price">{{ formatPrice(item.price) }}</div>
          </div>
          <div class="item-quantity">
            <el-button size="small" :disabled="item.quantity <= 1" @click="decrease(item)" circle>-</el-button>
            <span>{{ item.quantity }}</span>
            <el-button size="small" :disabled="item.quantity >= item.stockQuantity" @click="increase(item)" circle>+</el-button>
          </div>
          <div class="item-subtotal">{{ formatPrice(item.price * item.quantity) }}</div>
          <el-button type="danger" link @click="removeItem(item)">删除</el-button>
          <el-tag v-if="item.stockQuantity === 0" type="danger" size="small" style="position:absolute;bottom:4px;left:120px">库存不足</el-tag>
        </div>
        <div class="cart-footer">
          <span>已选 {{ cartStore.selectedItems.length }} 件，合计：<strong>{{ formatPrice(cartStore.totalAmount) }}</strong></span>
          <el-button type="danger" size="large" @click="goCheckout" :disabled="cartStore.selectedItems.length === 0">去结算</el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '@/stores/cart';
import { ElMessageBox } from 'element-plus';
import { formatPrice } from '@/utils/format';

const router = useRouter();
const cartStore = useCartStore();
const loading = ref(false);
const allSelected = computed(() => cartStore.items.length > 0 && cartStore.items.every(i => i.selected));

async function loadCart() { loading.value = true; await cartStore.fetchCart(); loading.value = false; }

async function decrease(item) { if (item.quantity > 1) await cartStore.updateQuantity(item.id, item.quantity - 1); }
async function increase(item) { if (item.quantity < item.stockQuantity) await cartStore.updateQuantity(item.id, item.quantity + 1); }

async function removeItem(item) {
  try {
    await ElMessageBox.confirm('确定删除该商品？', '确认操作', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' });
    await cartStore.removeItem(item.id);
  } catch { /* 用户取消 */ }
}

function goCheckout() { router.push('/checkout'); }

onMounted(loadCart);
</script>

<style scoped>
.cart-page { max-width: 900px; margin: 0 auto; }
.cart-card { margin-top: 16px; }
.cart-header { padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; }
.cart-item { display: flex; align-items: center; padding: 16px 0; border-bottom: 1px solid #f0f0f0; gap: 12px; position: relative; }
.item-img { width: 80px; height: 80px; object-fit: contain; background: #f5f5f5; border-radius: 4px; }
.item-info { flex: 1; }
.item-name { font-size: 14px; color: #333; }
.item-price { font-size: 13px; color: #999; margin-top: 4px; }
.item-quantity { display: flex; align-items: center; gap: 8px; }
.item-subtotal { font-size: 16px; color: #ff4d4f; font-weight: bold; width: 100px; text-align: right; }
.outofstock { background: #fff2f0; }
.cart-footer { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; }
.cart-footer strong { color: #ff4d4f; font-size: 20px; }
</style>
