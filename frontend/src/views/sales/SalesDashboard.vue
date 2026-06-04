<template>
  <div class="sales-dashboard">
    <h2>销售工作台</h2>
    <p class="subtitle">欢迎使用线下销售系统，请选择要执行的操作</p>

    <div class="action-grid">
      <router-link to="/sales/register" class="action-card">
        <div class="card-icon">👤</div>
        <h3>线下注册顾客</h3>
        <p>为到店新顾客注册系统账号，生成用户名和初始密码</p>
      </router-link>

      <router-link to="/sales/orders/new" class="action-card">
        <div class="card-icon">🛒</div>
        <h3>创建线下订单</h3>
        <p>为顾客选择商品、确认现场结付、录入物流信息</p>
      </router-link>

      <router-link to="/sales/orders" class="action-card">
        <div class="card-icon">📋</div>
        <h3>订单记录</h3>
        <p>查看您创建的线下订单记录和状态</p>
      </router-link>

      <router-link to="/products" class="action-card">
        <div class="card-icon">🔍</div>
        <h3>浏览商品</h3>
        <p>查看商品列表和详情，帮助顾客选购</p>
      </router-link>
    </div>
  </div>
</template>

<script setup>
// SalesDashboard - salesperson landing page
</script>

<style scoped>
.sales-dashboard { max-width: 900px; margin: 0 auto; padding: 24px; }
.sales-dashboard h2 { margin-bottom: 4px; }
.subtitle { color: #999; margin-bottom: 32px; font-size: 14px; }
.action-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
@media (max-width: 600px) { .action-grid { grid-template-columns: 1fr; } }
.action-card { display: block; background: #fff; padding: 28px 24px; border-radius: 8px; border: 1px solid #f0f0f0; text-decoration: none; color: inherit; transition: box-shadow 0.2s, border-color 0.2s; }
.action-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: #1890ff; }
.card-icon { font-size: 32px; margin-bottom: 12px; }
.action-card h3 { font-size: 16px; margin-bottom: 8px; color: #333; }
.action-card p { font-size: 13px; color: #999; line-height: 1.5; }
</style>
