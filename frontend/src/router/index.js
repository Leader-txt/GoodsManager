import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/', name: 'Home', component: () => import('@/views/HomeView.vue') },
  { path: '/products', name: 'ProductList', component: () => import('@/views/product/ProductList.vue') },
  { path: '/products/:id', name: 'ProductDetail', component: () => import('@/views/product/ProductDetail.vue') },
  { path: '/cart', name: 'Cart', component: () => import('@/views/cart/CartView.vue'), meta: { requiresAuth: true, role: 'customer' } },
  { path: '/checkout', name: 'Checkout', component: () => import('@/views/order/Checkout.vue'), meta: { requiresAuth: true, role: 'customer' } },
  { path: '/orders', name: 'OrderList', component: () => import('@/views/order/OrderList.vue'), meta: { requiresAuth: true } },
  { path: '/orders/:id', name: 'OrderDetail', component: () => import('@/views/order/OrderDetail.vue'), meta: { requiresAuth: true } },
  { path: '/login', name: 'Login', component: () => import('@/views/user/Login.vue') },
  { path: '/register', name: 'Register', component: () => import('@/views/user/Register.vue') },
  { path: '/profile', name: 'Profile', component: () => import('@/views/user/Profile.vue'), meta: { requiresAuth: true } },
  { path: '/sales', name: 'SalesDashboard', component: () => import('@/views/sales/SalesDashboard.vue'), meta: { requiresAuth: true, role: 'sales' } },
  { path: '/sales/register', name: 'SalesOfflineRegister', component: () => import('@/views/sales/OfflineRegister.vue'), meta: { requiresAuth: true, role: 'sales' } },
  { path: '/sales/orders/new', name: 'SalesOfflineOrder', component: () => import('@/views/sales/OfflineOrder.vue'), meta: { requiresAuth: true, role: 'sales' } },
  { path: '/sales/orders', name: 'SalesOrders', component: () => import('@/views/sales/SalesOrders.vue'), meta: { requiresAuth: true, role: 'sales' } },
  { path: '/warehouse', name: 'WarehouseInventory', component: () => import('@/views/warehouse/InventoryList.vue'), meta: { requiresAuth: true, role: ['warehouse', 'admin'] } },
  { path: '/warehouse/shelves', name: 'WarehouseShelves', component: () => import('@/views/warehouse/ShelfManage.vue'), meta: { requiresAuth: true, role: ['warehouse', 'admin'] } },
  { path: '/warehouse/inventory/:productId', name: 'WarehouseInventoryDetail', component: () => import('@/views/warehouse/InventoryDetail.vue'), meta: { requiresAuth: true, role: ['warehouse', 'admin'] } },
  { path: '/warehouse/stock-in', name: 'WarehouseStockIn', component: () => import('@/views/warehouse/StockIn.vue'), meta: { requiresAuth: true, role: ['warehouse', 'admin'] } },
  { path: '/warehouse/stock-out', name: 'WarehouseStockOut', component: () => import('@/views/warehouse/StockOut.vue'), meta: { requiresAuth: true, role: ['warehouse', 'admin'] } },
  { path: '/admin/dashboard', name: 'Dashboard', component: () => import('@/views/admin/Dashboard.vue'), meta: { requiresAuth: true, role: 'admin' } },
  { path: '/admin/sales', name: 'SalesManage', component: () => import('@/views/admin/SalesManage.vue'), meta: { requiresAuth: true, role: 'admin' } },
  { path: '/admin/products', name: 'ProductManage', component: () => import('@/views/admin/ProductManage.vue'), meta: { requiresAuth: true, role: 'admin' } },
  { path: '/admin/orders', name: 'OrderManage', component: () => import('@/views/admin/OrderManage.vue'), meta: { requiresAuth: true, role: 'admin' } },
  { path: '/admin/inventory-log', name: 'InventoryLog', component: () => import('@/views/admin/InventoryLog.vue'), meta: { requiresAuth: true, role: 'admin' } },
  { path: '/admin/system-log', name: 'SystemLog', component: () => import('@/views/admin/SystemLog.vue'), meta: { requiresAuth: true, role: 'admin' } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch {
    user = null;
  }

  if (to.meta.requiresAuth && !token) {
    return next({ path: '/login', query: { redirect: to.fullPath } });
  }

  if (to.meta.role && user) {
    const allowedRoles = Array.isArray(to.meta.role) ? to.meta.role : [to.meta.role];
    if (!allowedRoles.includes(user.role)) {
      return next({ path: '/' });
    }
  }

  next();
});

export default router;
