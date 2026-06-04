<template>
  <el-card :body-style="{ padding: '0' }" shadow="hover" class="product-card" :class="{ outofstock: product.stock_quantity === 0 }">
    <div class="card-image">
      <img :src="product.image_url || '/placeholder.png'" :alt="product.name" />
      <div v-if="product.stock_quantity === 0" class="outofstock-mask">
        <el-tag type="info">暂时缺货</el-tag>
      </div>
    </div>
    <div class="card-body">
      <el-tag size="small" type="primary">{{ product.category }}</el-tag>
      <h3 class="product-name">{{ product.name }}</h3>
      <div class="price-row">
        <span class="price">{{ formatPrice(product.price) }}</span>
        <span class="stock">库存: {{ product.stock_quantity }}</span>
      </div>
    </div>
    <div class="card-footer">
      <router-link :to="`/products/${product.id}`" class="btn-detail">
        <el-button type="primary" :disabled="product.stock_quantity === 0" style="width: 100%">查看详情</el-button>
      </router-link>
    </div>
  </el-card>
</template>

<script setup>
import { formatPrice } from '@/utils/format';
defineProps({ product: { type: Object, required: true } });
</script>

<style scoped>
.product-card {
  transition: transform 0.2s;
}
.product-card:hover {
  transform: translateY(-4px);
}
.card-image {
  height: 200px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.card-image img {
  max-width: 80%;
  max-height: 80%;
  object-fit: contain;
}
.outofstock-mask {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-body {
  padding: 12px 16px;
}
.product-name {
  font-size: 15px;
  margin: 8px 0;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.price {
  font-size: 18px;
  color: #ff4d4f;
  font-weight: bold;
}
.stock {
  font-size: 12px;
  color: #999;
}
.card-footer {
  padding: 0 16px 16px;
}
.btn-detail {
  text-decoration: none;
}
</style>
