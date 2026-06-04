<template>
  <div class="product-list-page">
    <el-input v-model="keyword" @input="onSearchInput" placeholder="请输入商品名称搜索..." clearable size="large" style="margin-bottom: 16px" />

    <el-card class="filter-bar" shadow="never">
      <div class="filter-row">
        <span class="filter-label">类型：</span>
        <el-radio-group v-model="filters.category" @change="selectCategory">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</el-radio-button>
        </el-radio-group>
      </div>
      <div v-if="brands.length" class="filter-row" style="margin-top:8px">
        <span class="filter-label">品牌：</span>
        <el-radio-group v-model="filters.brand" @change="selectBrand">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button v-for="b in brands" :key="b" :value="b">{{ b }}</el-radio-button>
        </el-radio-group>
      </div>
      <div class="filter-row" style="margin-top:8px">
        <span class="filter-label">排序：</span>
        <el-radio-group v-model="filters.sort" @change="selectSort">
          <el-radio-button value="default">默认</el-radio-button>
          <el-radio-button value="price_asc">价格↑</el-radio-button>
          <el-radio-button value="price_desc">价格↓</el-radio-button>
        </el-radio-group>
      </div>
    </el-card>

    <div v-loading="loading">
      <el-empty v-if="!loading && products.length === 0" description="暂无商品" />
      <div v-else class="product-grid">
        <ProductCard v-for="p in products" :key="p.id" :product="p" />
      </div>
    </div>

    <el-pagination :current-page="currentPage" :page-size="pageSize" :total="total" @current-change="changePage" layout="total, prev, pager, next" style="margin-top: 16px; justify-content: center" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getProducts, getCategories, getBrands } from '@/api/product';
import ProductCard from '@/components/product/ProductCard.vue';

const route = useRoute();
const products = ref([]);
const total = ref(0);
const loading = ref(false);
const keyword = ref('');
const categories = ref([]);
const brands = ref([]);
const filters = ref({ category: '', brand: '', sort: 'default' });
const currentPage = ref(1);
const pageSize = ref(12);

let searchTimer = null;

async function fetchProducts() {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value, pageSize: pageSize.value, keyword: keyword.value,
      category: filters.value.category, brand: filters.value.brand, sort: filters.value.sort,
    };
    const res = await getProducts(params);
    if (res.code === 200) { products.value = res.data.list; total.value = res.data.total; }
  } finally { loading.value = false; }
}

function onSearchInput() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { currentPage.value = 1; fetchProducts(); }, 300);
}

function selectCategory() { currentPage.value = 1; fetchProducts(); }
function selectSort() { currentPage.value = 1; fetchProducts(); }
function selectBrand() { currentPage.value = 1; fetchProducts(); }
function changePage(page) { currentPage.value = page; fetchProducts(); }

onMounted(async () => {
  if (route.query.category) filters.value.category = route.query.category;
  try { const res = await getCategories(); if (res.code === 200) categories.value = res.data; } catch { /* ignore */ }
  try { const res = await getBrands(); if (res.code === 200) brands.value = res.data; } catch { /* ignore */ }
  fetchProducts();
});
</script>

<style scoped>
.filter-bar { margin-bottom: 16px; }
.filter-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.filter-label { color: #999; font-size: 13px; width: 50px; flex-shrink: 0; }
.product-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
@media (max-width: 900px) { .product-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 600px) { .product-grid { grid-template-columns: repeat(2, 1fr); } }
</style>
