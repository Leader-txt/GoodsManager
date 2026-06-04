<template>
  <div class="product-detail-page" v-loading="loading">
    <router-link to="/products" class="back-link">← 返回商品列表</router-link>
    <div v-if="!loading && !product" class="empty-state">商品不存在</div>
    <div v-else-if="product" class="detail-layout">
      <div class="detail-image">
        <img :src="product.image_url || '/placeholder.png'" :alt="product.name" />
      </div>
      <div class="detail-info">
        <h2>{{ product.name }}</h2>
        <div class="meta">
          <el-tag size="small">{{ product.category }}</el-tag>
          <el-tag v-if="product.brand" size="small" type="info">品牌: {{ product.brand }}</el-tag>
        </div>
        <div class="price-box">
          <span class="price">{{ formatPrice(product.price) }}</span>
        </div>
        <div class="stock-status">
          库存状态:
          <el-tag v-if="product.stock_quantity > 0" type="success" size="small">有货 ({{ product.stock_quantity }}件)</el-tag>
          <el-tag v-else type="danger" size="small">暂时缺货</el-tag>
        </div>
        <div class="actions">
          <el-button type="warning" size="large" @click="showQtyDialog = true" :disabled="product.stock_quantity === 0">加入购物车</el-button>
        </div>
      </div>
    </div>

    <el-dialog v-model="showQtyDialog" title="加入购物车" width="360px">
      <p style="color:#666;font-size:14px;margin-bottom:20px">{{ product?.name }}</p>
      <div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:20px">
        <el-button :disabled="qty <= 1" @click="qty = Math.max(1, qty - 1)" circle>-</el-button>
        <span style="font-size:22px;font-weight:bold;min-width:40px;text-align:center">{{ qty }}</span>
        <el-button :disabled="qty >= (product?.stock_quantity || 1)" @click="qty = Math.min(product?.stock_quantity || 1, qty + 1)" circle>+</el-button>
      </div>
      <template #footer>
        <el-button @click="showQtyDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAddToCart" :loading="adding">确认加入</el-button>
      </template>
    </el-dialog>

    <el-card v-if="product && product.specs && product.specs.length" class="specs-section" style="margin-top:20px">
      <template #header><h3>规格参数</h3></template>
      <SpecTable :specs="product.specs" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getProductDetail } from '@/api/product';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';
import { ElMessage } from 'element-plus';
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
  try { const res = await getProductDetail(route.params.id); if (res.code === 200) product.value = res.data; }
  finally { loading.value = false; }
}

async function confirmAddToCart() {
  if (!auth.isLoggedIn) { router.push('/login'); return; }
  adding.value = true;
  try {
    await cartStore.addToCart(product.value.id, qty.value);
    showQtyDialog.value = false;
    qty.value = 1;
    ElMessage.success('已加入购物车');
  } catch (err) { ElMessage.error(err.message || '操作失败'); }
  finally { adding.value = false; }
}

onMounted(loadProduct);
</script>

<style scoped>
.back-link { display: inline-block; margin-bottom: 16px; color: #1890ff; font-size: 14px; }
.detail-layout { display: flex; gap: 32px; background: #fff; padding: 24px; border-radius: 8px; }
.detail-image { width: 400px; height: 400px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; border-radius: 4px; flex-shrink: 0; }
.detail-image img { max-width: 80%; max-height: 80%; object-fit: contain; }
.detail-info { flex: 1; }
.detail-info h2 { font-size: 22px; margin-bottom: 12px; }
.meta { display: flex; gap: 8px; margin-bottom: 16px; }
.price-box { margin-bottom: 16px; }
.price { font-size: 28px; color: #ff4d4f; font-weight: bold; }
.stock-status { margin-bottom: 24px; font-size: 14px; display: flex; align-items: center; gap: 8px; }
.actions { display: flex; gap: 12px; }
.specs-section h3 { margin: 0; }
.empty-state { text-align: center; padding: 60px; color: #999; }
@media (max-width: 768px) { .detail-layout { flex-direction: column; } .detail-image { width: 100%; height: 300px; } }
</style>
