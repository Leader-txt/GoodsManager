<template>
  <div class="home">
    <h1>欢迎来到联想旗舰店</h1>
    <p>浏览精选商品，享受优质购物体验</p>
    <router-link to="/products" class="btn">浏览商品</router-link>
  </div>
</template>

<style scoped>
.home { text-align: center; padding: 80px 20px; }
.home h1 { font-size: 32px; margin-bottom: 16px; color: #333; }
.home p { font-size: 18px; color: #666; margin-bottom: 32px; }
.btn { display: inline-block; background: #1890ff; color: #fff; padding: 12px 32px; border-radius: 6px; font-size: 16px; }
.btn:hover { background: #40a9ff; }
</style>
