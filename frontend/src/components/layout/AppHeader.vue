<template>
  <div class="app-header-wrapper">
    <div class="header-inner">
      <router-link to="/" class="logo">联想旗舰店</router-link>
      <el-menu
        mode="horizontal"
        :router="true"
        :default-active="currentRoute"
        class="nav-menu"
        :ellipsis="false"
      >
        <el-menu-item index="/">首页</el-menu-item>
        <el-menu-item index="/products">商品</el-menu-item>

        <template v-if="auth.isLoggedIn">
          <el-menu-item v-if="auth.role === 'customer'" index="/orders">我的订单</el-menu-item>
          <el-menu-item v-if="auth.role === 'customer'" index="/cart" class="cart-menu-item">
            <el-badge :value="cartStore.count" :hidden="cartStore.count === 0" :max="99">
              购物车
            </el-badge>
          </el-menu-item>

          <template v-if="auth.role === 'sales'">
            <el-menu-item index="/sales">销售工作台</el-menu-item>
            <el-menu-item index="/sales/register">线下注册</el-menu-item>
            <el-menu-item index="/sales/orders/new">创建订单</el-menu-item>
          </template>

          <template v-if="auth.role === 'warehouse' || auth.role === 'admin'">
            <el-menu-item index="/warehouse">库存管理</el-menu-item>
            <el-menu-item index="/warehouse/shelves">货架管理</el-menu-item>
            <el-menu-item index="/warehouse/orders">待出库订单</el-menu-item>
          </template>

          <el-menu-item index="/profile">个人信息</el-menu-item>
          <el-menu-item v-if="auth.role === 'admin'" index="/admin/dashboard">管理后台</el-menu-item>
          <li class="el-menu-item logout-item" @click="handleLogout">退出</li>
        </template>

        <template v-else>
          <el-menu-item index="/login">登录</el-menu-item>
          <el-menu-item index="/register">注册</el-menu-item>
        </template>
      </el-menu>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';

const auth = useAuthStore();
const cartStore = useCartStore();
const route = useRoute();
const router = useRouter();

const currentRoute = computed(() => route.path);

function handleLogout() {
  auth.logout();
  router.push('/login');
}
</script>

<style scoped>
.app-header-wrapper {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
}

.logo {
  font-size: 18px;
  font-weight: bold;
  color: #1890ff;
  text-decoration: none;
  flex-shrink: 0;
  padding: 0 20px;
  white-space: nowrap;
}

.nav-menu {
  flex: 1;
  border-bottom: none !important;
}

.nav-menu .el-menu-item {
  border-bottom: 2px solid transparent;
}

.nav-menu .el-menu-item.is-active {
  border-bottom-color: #1890ff;
  color: #1890ff;
}

.logout-item {
  cursor: pointer;
  color: #f56c6c !important;
}
</style>
