<template>
  <div class="home-page">
    <!-- Hero 横幅区 -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">联想旗舰店</h1>
        <p class="hero-subtitle">精选好物，品质之选</p>
        <router-link to="/products" class="hero-btn">浏览商品</router-link>
      </div>
    </section>

    <!-- 商品分类快捷入口 -->
    <section class="section">
      <h2 class="section-title">商品分类</h2>
      <div v-if="categories.length" class="category-grid">
        <router-link
          v-for="cat in categories"
          :key="cat"
          :to="{ path: '/products', query: { category: cat } }"
          class="category-card"
        >
          <span class="category-emoji">{{ categoryEmoji[cat] || '📦' }}</span>
          <span class="category-name">{{ cat }}</span>
        </router-link>
      </div>
    </section>

    <!-- 精选商品 -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">精选商品</h2>
        <router-link to="/products" class="view-more">查看更多 →</router-link>
      </div>
      <div v-if="loading" class="state-hint">加载中...</div>
      <div v-else-if="products.length" class="product-grid">
        <ProductCard v-for="p in products" :key="p.id" :product="p" />
      </div>
      <div v-else class="state-hint">暂无商品</div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getProducts, getCategories } from '@/api/product';
import ProductCard from '@/components/product/ProductCard.vue';

const products = ref([]);
const categories = ref([]);
const loading = ref(false);

const categoryEmoji = {
  '笔记本电脑': '💻',
  '台式电脑': '🖥️',
  '平板': '📱',
  '智能手机': '📱',
  '蓝牙耳机': '🎧',
  '摄像头': '📷',
  '投影仪': '📽️',
  '电视': '📺',
  '键盘': '⌨️',
  '鼠标': '🖱️',
};

onMounted(async () => {
  // 加载分类
  try {
    const res = await getCategories();
    if (res.code === 200) categories.value = res.data;
  } catch { /* ignore */ }

  // 加载精选商品
  loading.value = true;
  try {
    const res = await getProducts({ page: 1, pageSize: 8, sort: 'default' });
    if (res.code === 200) products.value = res.data.list;
  } catch { /* ignore */ }
  loading.value = false;
});
</script>

<style scoped>
/* ====== Hero 横幅区 ====== */
.hero {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border-radius: 12px;
  padding: 80px 40px;
  text-align: center;
  margin-bottom: 40px;
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 400px;
  height: 400px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
}

.hero::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -10%;
  width: 300px;
  height: 300px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 50%;
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: 40px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12px;
  letter-spacing: 2px;
}

.hero-subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.75);
  margin-bottom: 36px;
}

.hero-btn {
  display: inline-block;
  padding: 12px 40px;
  border: 2px solid rgba(255, 255, 255, 0.85);
  color: #fff;
  border-radius: 24px;
  font-size: 16px;
  transition: all 0.3s;
}

.hero-btn:hover {
  background: #fff;
  color: #1890ff;
  border-color: #fff;
}

/* ====== 通用 section ====== */
.section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.section-title {
  font-size: 22px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
  padding-left: 14px;
  position: relative;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 4px;
  background: #1890ff;
  border-radius: 2px;
}

.view-more {
  font-size: 14px;
  color: #999;
  transition: color 0.2s;
}

.view-more:hover {
  color: #1890ff;
}

/* ====== 分类卡片网格 ====== */
.category-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.category-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.category-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
  color: #1890ff;
}

.category-emoji {
  font-size: 32px;
}

.category-name {
  font-size: 13px;
  color: #666;
}

/* ====== 商品网格 ====== */
.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

/* ====== 状态提示 ====== */
.state-hint {
  text-align: center;
  padding: 60px;
  color: #999;
  font-size: 16px;
}

/* ====== 响应式 ====== */
@media (max-width: 900px) {
  .hero {
    padding: 60px 24px;
  }
  .hero-title {
    font-size: 32px;
  }
  .hero-subtitle {
    font-size: 16px;
  }
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .category-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 600px) {
  .hero {
    padding: 40px 16px;
    border-radius: 8px;
  }
  .hero-title {
    font-size: 26px;
  }
  .hero-subtitle {
    font-size: 14px;
    margin-bottom: 24px;
  }
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .category-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
}
</style>
