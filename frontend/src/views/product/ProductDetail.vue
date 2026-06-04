<template>
  <div class="product-detail-page">
    <router-link to="/products" class="back-link">← 返回商品列表</router-link>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="!product" class="empty">商品不存在</div>
    <div v-else class="detail-layout">
      <div class="detail-image">
        <img :src="product.image_url || '/placeholder.png'" :alt="product.name" />
      </div>
      <div class="detail-info">
        <h2>{{ product.name }}</h2>
        <div class="meta">
          <span class="tag">品牌: {{ product.brand }}</span>
          <span class="tag">{{ product.category }}</span>
        </div>
        <div class="price-box">
          <span class="price">{{ formatPrice(product.price) }}</span>
        </div>
        <div class="stock-status">
          库存状态:
          <span v-if="product.stock_quantity > 0" class="in-stock">有货 ({{ product.stock_quantity }}件)</span>
          <span v-else class="out-stock">暂时缺货</span>
        </div>
        <div class="actions">
          <button @click="showQtyDialog = true" :disabled="product.stock_quantity === 0" class="btn-cart">
            加入购物车
          </button>
        </div>
      </div>
    </div>
    <!-- 数量选择弹窗 -->
    <div v-if="showQtyDialog" class="modal-overlay" @click.self="showQtyDialog = false">
      <div class="modal-box">
        <h3>加入购物车</h3>
        <p class="modal-product-name">{{ product?.name }}</p>
        <div class="qty-selector">
          <button @click="qty = Math.max(1, qty - 1)" class="qty-btn">-</button>
          <span class="qty-display">{{ qty }}</span>
          <button @click="qty = Math.min(product?.stock_quantity || 1, qty + 1)" class="qty-btn">+</button>
        </div>
        <div class="modal-actions">
          <button @click="showQtyDialog = false" class="btn-cancel">取消</button>
          <button @click="confirmAddToCart" :disabled="adding" class="btn-confirm">{{ adding ? '处理中...' : '确认加入' }}</button>
        </div>
      </div>
    </div>

    <div v-if="product && product.specs && product.specs.length" class="specs-section">
      <h3>规格参数</h3>
      <SpecTable :specs="product.specs" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getProductDetail } from '@/api/product';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';
import SpecTable from '@/components/product/SpecTable.vue';
import { formatPrice } from '@/utils/format';

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const auth = useAuthStore();

const product = ref(null);
const loading = ref(true);
const adding = ref(false);
const showQtyDialog = ref(false);
const qty = ref(1);

async function loadProduct() {
  try {
    const res = await getProductDetail(route.params.id);
    if (res.code === 200) product.value = res.data;
  } finally {
    loading.value = false;
  }
}

async function confirmAddToCart() {
  if (!auth.isLoggedIn) {
    router.push('/login');
    return;
  }
  adding.value = true;
  try {
    await cartStore.addToCart(product.value.id, qty.value);
    showQtyDialog.value = false;
    qty.value = 1;
    alert('已加入购物车');
  } catch (err) {
    alert(err.message || '操作失败');
  } finally {
    adding.value = false;
  }
}

onMounted(loadProduct);
</script>

<style scoped>
.back-link { display: inline-block; margin-bottom: 16px; color: #1890ff; font-size: 14px; }
.detail-layout { display: flex; gap: 32px; background: #fff; padding: 24px; border-radius: 8px; }
.detail-image { width: 400px; height: 400px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; border-radius: 4px; }
.detail-image img { max-width: 80%; max-height: 80%; object-fit: contain; }
.detail-info { flex: 1; }
.detail-info h2 { font-size: 22px; margin-bottom: 12px; }
.meta { display: flex; gap: 12px; margin-bottom: 16px; }
.tag { font-size: 13px; color: #666; background: #f0f0f0; padding: 2px 10px; border-radius: 4px; }
.price-box { margin-bottom: 16px; }
.price { font-size: 28px; color: #ff4d4f; font-weight: bold; }
.stock-status { margin-bottom: 24px; font-size: 14px; }
.in-stock { color: #52c41a; }
.out-stock { color: #ff4d4f; }
.actions { display: flex; gap: 12px; }
.btn-cart { padding: 10px 24px; background: #faad14; color: #fff; border: none; border-radius: 4px; font-size: 16px; }
.btn-cart:hover { background: #ffc53d; }
.btn-cart:disabled { background: #ccc; cursor: not-allowed; }
.specs-section { background: #fff; margin-top: 20px; padding: 24px; border-radius: 8px; }
.specs-section h3 { margin-bottom: 16px; }
.loading, .empty { text-align: center; padding: 60px; color: #999; }

.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-box { background: #fff; padding: 24px; border-radius: 8px; width: 360px; max-width: 90%; }
.modal-box h3 { margin-bottom: 8px; }
.modal-product-name { color: #666; font-size: 14px; margin-bottom: 20px; }
.qty-selector { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 20px; }
.qty-btn { width: 36px; height: 36px; border: 1px solid #d9d9d9; background: #fff; border-radius: 4px; font-size: 20px; line-height: 1; cursor: pointer; }
.qty-btn:hover { border-color: #1890ff; color: #1890ff; }
.qty-display { font-size: 22px; font-weight: bold; min-width: 40px; text-align: center; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
.btn-cancel { padding: 8px 16px; background: #fff; border: 1px solid #d9d9d9; border-radius: 4px; cursor: pointer; }
.btn-confirm { padding: 8px 16px; background: #1890ff; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
.btn-confirm:disabled { background: #ccc; }
</style>
