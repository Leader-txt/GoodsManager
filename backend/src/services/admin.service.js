const pool = require('../config/db');
const { userDao } = require('../dao/user.dao');
const orderDao = require('../dao/order.dao');
const { inventoryLogDao } = require('../dao/inventory.dao');
const passwordUtil = require('../utils/password');
const crypto = require('crypto');

const adminService = {
  /** 仪表盘统计 */
  async dashboard() {
    const results = await Promise.all([
      pool.query("SELECT COUNT(*) as todayOrders FROM `order` WHERE DATE(created_at) = CURDATE()"),
      pool.query("SELECT COUNT(*) as pendingOrders FROM `order` WHERE status = 'pending'"),
      pool.query("SELECT COUNT(*) as outOfStock FROM inventory WHERE quantity = 0"),
      pool.query("SELECT COUNT(*) as salesCount FROM `user` WHERE role = 'sales'"),
      pool.query("SELECT o.*, c.real_name as customer_name FROM `order` o JOIN customer c ON o.customer_id = c.id ORDER BY o.created_at DESC LIMIT 5"),
      inventoryLogDao.findRecent(5),
    ]);

    // pool.query() returns [rows, fields]; extract rows[0] for count queries
    const todayOrders = results[0][0][0]?.todayOrders ?? 0;
    const pendingOrders = results[1][0][0]?.pendingOrders ?? 0;
    const outOfStock = results[2][0][0]?.outOfStock ?? 0;
    const salesCount = results[3][0][0]?.salesCount ?? 0;
    const recentOrders = results[4][0] || [];
    const recentLogs = results[5];

    return {
      todayOrders,
      pendingOrders,
      outOfStock,
      salesCount,
      recentOrders,
      recentLogs,
    };
  },

  /** 销售人员列表 */
  async listSales({ page, pageSize }) {
    const result = await userDao.findByRole('sales', { page, pageSize });
    return result;
  },

  /** 添加销售人员 */
  async createSales({ username, password, realName }) {
    const existing = await userDao.findByUsername(username);
    if (existing) {
      throw Object.assign(new Error('用户名已存在'), { statusCode: 400 });
    }
    const hashedPassword = await passwordUtil.hash(password);
    const userId = await userDao.create({ username, password: hashedPassword, role: 'sales' });
    return { userId, username, realName };
  },

  /** 删除销售人员 */
  async deleteSales(salesId) {
    const user = await userDao.findById(salesId);
    if (!user || user.role !== 'sales') {
      throw Object.assign(new Error('销售人员不存在'), { statusCode: 404 });
    }
    const unfinished = await orderDao.countUnfinishedBySales(salesId);
    if (unfinished > 0) {
      throw Object.assign(new Error('该销售人员尚有未完成订单，请先处理'), { statusCode: 400 });
    }
    await userDao.deleteById(salesId);
    return { salesId };
  },

  /** 重置销售人员密码 */
  async resetPassword(salesId) {
    const user = await userDao.findById(salesId);
    if (!user || user.role !== 'sales') {
      throw Object.assign(new Error('销售人员不存在'), { statusCode: 404 });
    }
    const newPassword = crypto.randomBytes(4).toString('hex');
    const hashedPassword = await passwordUtil.hash(newPassword);
    await userDao.updatePassword(salesId, hashedPassword);
    return { newPassword };
  },

  /** 全部订单 */
  async listOrders(params) {
    return orderDao.findAll(params);
  },

  /** 出入库日志 */
  async listInventoryLogs(params) {
    return inventoryLogDao.findAll(params);
  },

  /** 获取操作员列表 */
  async listOperators() {
    return inventoryLogDao.getOperators();
  },
};

module.exports = adminService;
