<template>
  <div class="product-card" :class="{ outofstock: product.stock_quantity === 0 }">
    <div class="card-image">
      <img :src="product.image_url || '/placeholder.png'" :alt="product.name" />
      <div v-if="product.stock_quantity === 0" class="outofstock-mask">
        <span>暂时缺货</span>
      </div>
    </div>
    <div class="card-body">
      <span class="category-tag">{{ product.category }}</span>
      <h3 class="product-name">{{ product.name }}</h3>
      <div class="price-row">
        <span class="price">{{ formatPrice(product.price) }}</span>
        <span class="stock">库存: {{ product.stock_quantity }}</span>
      </div>
    </div>
    <div class="card-footer">
      <router-link :to="`/products/${product.id}`" class="btn-detail">查看详情</router-link>
    </div>
  </div>
</template>

<script setup>
import { formatPrice } from '@/utils/format';
defineProps({ product: { type: Object, required: true } });
</script>

<style scoped>
.product-card { background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); transition: box-shadow 0.3s; position: relative; }
.product-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
.card-image { height: 200px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; position: relative; }
.card-image img { max-width: 80%; max-height: 80%; object-fit: contain; }
.outofstock-mask { position: absolute; inset: 0; background: rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center; }
.outofstock-mask span { background: #999; color: #fff; padding: 6px 16px; border-radius: 4px; font-size: 14px; }
.card-body { padding: 12px; }
.category-tag { font-size: 12px; color: #1890ff; background: #e6f7ff; padding: 2px 8px; border-radius: 2px; }
.product-name { font-size: 15px; margin: 8px 0; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.price-row { display: flex; justify-content: space-between; align-items: center; }
.price { font-size: 18px; color: #ff4d4f; font-weight: bold; }
.stock { font-size: 12px; color: #999; }
.card-footer { padding: 0 12px 12px; }
.btn-detail { display: block; text-align: center; padding: 8px; background: #1890ff; color: #fff; border-radius: 4px; font-size: 14px; }
.btn-detail:hover { background: #40a9ff; }
.outofstock .btn-detail { background: #ccc; pointer-events: none; }
</style>
