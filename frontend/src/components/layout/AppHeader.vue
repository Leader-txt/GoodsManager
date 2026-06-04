<template>
  <header class="app-header">
    <div class="header-inner">
      <router-link to="/" class="logo">联想旗舰店</router-link>
      <nav class="nav-links">
        <router-link to="/">首页</router-link>
        <router-link to="/products">商品</router-link>
        <template v-if="auth.isLoggedIn">
          <router-link v-if="auth.role === 'customer'" to="/orders">我的订单</router-link>
          <router-link v-if="auth.role === 'customer'" to="/cart" class="cart-link">
            🛒 购物车
            <span v-if="cartStore.count > 0" class="cart-badge">{{ cartStore.count }}</span>
          </router-link>
          <template v-if="auth.role === 'sales'">
            <router-link to="/sales">销售工作台</router-link>
            <router-link to="/sales/register">线下注册</router-link>
            <router-link to="/sales/orders/new">创建订单</router-link>
          </template>
          <template v-if="auth.role === 'warehouse' || auth.role === 'admin'">
            <router-link to="/warehouse">库存管理</router-link>
            <router-link to="/warehouse/shelves">货架管理</router-link>
          </template>
          <router-link to="/profile">个人信息</router-link>
          <router-link v-if="auth.role === 'admin'" to="/admin/dashboard">管理后台</router-link>
          <a href="#" @click.prevent="handleLogout">退出</a>
        </template>
        <template v-else>
          <router-link to="/login">登录</router-link>
          <router-link to="/register">注册</router-link>
        </template>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const cartStore = useCartStore();
const router = useRouter();

function handleLogout() {
  auth.logout();
  router.push('/login');
}
</script>

<style scoped>
.app-header {
  background: #1890ff;
  color: #fff;
  padding: 0 20px;
  height: 56px;
  line-height: 56px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}
.logo {
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  line-height: 56px;
}
.nav-links a {
  color: rgba(255,255,255,0.85);
  margin-left: 20px;
  line-height: 56px;
}
.nav-links a:hover {
  color: #fff;
}
.nav-links a.router-link-active {
  color: #fff;
  border-bottom: 2px solid #fff;
}
.cart-link {
  position: relative;
}
.cart-badge {
  position: absolute;
  top: 8px;
  right: -14px;
  background: #ff4d4f;
  color: #fff;
  font-size: 12px;
  border-radius: 10px;
  padding: 0 6px;
  height: 18px;
  line-height: 18px;
  min-width: 18px;
  text-align: center;
}
</style>
