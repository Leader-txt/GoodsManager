const app = require('./app');
const config = require('./config');
const cron = require('node-cron');

// 定时任务占位 — 将在订单模块实现后注册
// cron.schedule('*/5 * * * *', () => { ... });`z
const orderService = require('./services/order.service');

// 定时任务: 每5分钟扫描超时未支付订单并自动取消
cron.schedule('*/5 * * * *', async () => {
  try {
    const count = await orderService.cancelExpiredOrders();
    if (count > 0) {
      console.log(`[Cron] 自动取消 ${count} 个超时订单`);
    }
  } catch (err) {
    console.error('[Cron] 超时订单取消失败:', err.message);
  }
});

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`[GoodsManager] 后端服务已启动: http://localhost:${PORT}`);
  console.log(`[GoodsManager] 健康检查: http://localhost:${PORT}/api/health`);
});
