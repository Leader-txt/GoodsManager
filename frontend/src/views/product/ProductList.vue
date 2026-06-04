<template>
  <div class="product-list-page">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <input v-model="keyword" @input="onSearchInput" type="text" placeholder="请输入商品名称搜索..." class="search-input" />
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-row">
        <span class="filter-label">类型：</span>
        <button :class="{ active: !filters.category }" @click="selectCategory('')">全部</button>
        <button v-for="cat in categories" :key="cat" :class="{ active: filters.category === cat }" @click="selectCategory(cat)">{{ cat }}</button>
      </div>
      <div v-if="brands.length" class="filter-row">
        <span class="filter-label">品牌：</span>
        <button :class="{ active: !filters.brand }" @click="selectBrand('')">全部</button>
        <button v-for="b in brands" :key="b" :class="{ active: filters.brand === b }" @click="selectBrand(b)">{{ b }}</button>
      </div>
      <div class="filter-row">
        <span class="filter-label">排序：</span>
        <button :class="{ active: filters.sort === 'default' }" @click="selectSort('default')">默认</button>
        <button :class="{ active: filters.sort === 'price_asc' }" @click="selectSort('price_asc')">价格↑</button>
        <button :class="{ active: filters.sort === 'price_desc' }" @click="selectSort('price_desc')">价格↓</button>
      </div>
    </div>

    <!-- 商品列表 -->
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="products.length === 0" class="empty">暂无商品</div>
    <div v-else class="product-grid">
      <ProductCard v-for="p in products" :key="p.id" :product="p" />
    </div>

    <Pagination :currentPage="currentPage" :pageSize="pageSize" :total="total" @change="changePage" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getProducts, getCategories, getBrands } from '@/api/product';
import ProductCard from '@/components/product/ProductCard.vue';
import Pagination from '@/components/common/Pagination.vue';
import { useProductStore } from '@/stores/product';

const route = useRoute();
const store = useProductStore();
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
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: keyword.value,
      category: filters.value.category,
      brand: filters.value.brand,
      sort: filters.value.sort,
    };
    const res = await getProducts(params);
    if (res.code === 200) {
      products.value = res.data.list;
      console.log(products.value)
      total.value = res.data.total;
    }
  } finally {
    loading.value = false;
  }
}

function onSearchInput() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { currentPage.value = 1; fetchProducts(); }, 300);
}

function selectCategory(cat) {
  filters.value.category = cat;
  currentPage.value = 1;
  fetchProducts();
}

function selectSort(sort) {
  filters.value.sort = sort;
  currentPage.value = 1;
  fetchProducts();
}

function selectBrand(brand) {
  filters.value.brand = brand;
  currentPage.value = 1;
  fetchProducts();
}

function changePage(page) {
  currentPage.value = page;
  fetchProducts();
}

onMounted(async () => {
  // 读取 URL 查询参数中的分类筛选
  if (route.query.category) {
    filters.value.category = route.query.category;
  }
  try {
    const res = await getCategories();
    if (res.code === 200) categories.value = res.data;
  } catch { /* ignore */ }
  try {
    const res = await getBrands();
    if (res.code === 200) brands.value = res.data;
  } catch { /* ignore */ }
  fetchProducts();
});
</script>

<style scoped>
.search-bar { margin-bottom: 16px; }
.search-input { width: 100%; padding: 12px 16px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 15px; }
.search-input:focus { border-color: #1890ff; outline: none; }
.filter-bar { background: #fff; padding: 12px 16px; border-radius: 4px; margin-bottom: 16px; }
.filter-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
.filter-row:last-child { margin-bottom: 0; }
.filter-label { color: #999; font-size: 13px; width: 50px; flex-shrink: 0; }
.filter-row button { padding: 4px 12px; border: 1px solid #d9d9d9; background: #fff; border-radius: 4px; font-size: 13px; color: #666; }
.filter-row button.active { background: #1890ff; color: #fff; border-color: #1890ff; }
.product-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
@media (max-width: 900px) { .product-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 600px) { .product-grid { grid-template-columns: repeat(2, 1fr); } }
.loading, .empty { text-align: center; padding: 60px; color: #999; font-size: 16px; }
</style>
