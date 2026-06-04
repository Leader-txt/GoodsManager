<template>
  <div class="sales-dashboard">
    <h2>销售工作台</h2>
    <p class="subtitle">欢迎使用线下销售系统，请选择要执行的操作</p>

    <el-row :gutter="20">
      <el-col :span="12">
        <router-link to="/sales/register" class="action-link">
          <el-card shadow="hover" class="action-card">
            <div class="card-icon">👤</div>
            <h3>线下注册顾客</h3>
            <p>为到店新顾客注册系统账号，生成用户名和初始密码</p>
          </el-card>
        </router-link>
      </el-col>
      <el-col :span="12">
        <router-link to="/sales/orders/new" class="action-link">
          <el-card shadow="hover" class="action-card">
            <div class="card-icon">🛒</div>
            <h3>创建线下订单</h3>
            <p>为顾客选择商品、确认现场结付、录入物流信息</p>
          </el-card>
        </router-link>
      </el-col>
      <el-col :span="12">
        <router-link to="/sales/orders" class="action-link">
          <el-card shadow="hover" class="action-card">
            <div class="card-icon">📋</div>
            <h3>订单记录</h3>
            <p>查看您创建的线下订单记录和状态</p>
          </el-card>
        </router-link>
      </el-col>
      <el-col :span="12">
        <router-link to="/products" class="action-link">
          <el-card shadow="hover" class="action-card">
            <div class="card-icon">🔍</div>
            <h3>浏览商品</h3>
            <p>查看商品列表和详情，帮助顾客选购</p>
          </el-card>
        </router-link>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
// SalesDashboard - salesperson landing page
</script>

<style scoped>
.sales-dashboard { max-width: 900px; margin: 0 auto; padding: 24px; }
.sales-dashboard h2 { margin-bottom: 4px; }
.subtitle { color: #999; margin-bottom: 32px; font-size: 14px; }
.action-link { text-decoration: none; color: inherit; display: block; margin-bottom: 20px; }
.action-card { cursor: pointer; transition: border-color 0.2s; }
.action-card:hover { border-color: #1890ff; }
.card-icon { font-size: 32px; margin-bottom: 12px; }
.action-card h3 { font-size: 16px; margin: 0 0 8px; color: #333; }
.action-card p { font-size: 13px; color: #999; line-height: 1.5; margin: 0; }
</style>
