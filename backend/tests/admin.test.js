/**
 * 管理后台模块集成测试
 * 覆盖: admin.service.js (dashboard, sales CRUD, order list, inventory logs, system logs)
 */

const adminService = require('../src/services/admin.service');
const logService = require('../src/services/log.service');
const { userDao } = require('../src/dao/user.dao');
const pool = require('../src/config/db');

describe('管理后台模块 (services/admin.service.js)', () => {
  let adminUserId;
  let createdSalesIds = [];

  beforeAll(async () => {
    const adminUser = await userDao.findByUsername('admin');
    adminUserId = adminUser.id;
  });

  afterAll(async () => {
    // 清理测试销售人员
    for (const sid of createdSalesIds) {
      try {
        const conn = await pool.getConnection();
        await conn.query('DELETE FROM user WHERE id = ?', [sid]);
        conn.release();
      } catch (e) { /* ignore */ }
    }
  }, 15000);

  // ==========================================================
  // 仪表盘
  // ==========================================================
  describe('dashboard() — 仪表盘统计', () => {
    test('获取仪表盘统计数据', async () => {
      const result = await adminService.dashboard();
      expect(result).toHaveProperty('todayOrders');
      expect(result).toHaveProperty('pendingOrders');
      expect(result).toHaveProperty('outOfStock');
      expect(result).toHaveProperty('salesCount');
      expect(result).toHaveProperty('recentOrders');
      expect(result).toHaveProperty('recentLogs');
      expect(typeof result.todayOrders).toBe('number');
      expect(typeof result.salesCount).toBe('number');
      expect(Array.isArray(result.recentOrders)).toBe(true);
      expect(Array.isArray(result.recentLogs)).toBe(true);
    });
  });

  // ==========================================================
  // 销售人员管理
  // ==========================================================
  describe('销售人员 CRUD', () => {
    test('listSales() 获取销售人员列表', async () => {
      const result = await adminService.listSales({ page: 1, pageSize: 10 });
      expect(result.total).toBeGreaterThanOrEqual(1);
      result.list.forEach(user => {
        expect(user.role).toBe('sales');
      });
    });

    test('createSales() 成功添加销售人员', async () => {
      const uniqUsername = `sales_test_${Date.now()}`;
      const result = await adminService.createSales({
        username: uniqUsername,
        password: 'salespass123',
        realName: '新销售',
      });
      expect(result.userId).toBeGreaterThan(0);
      expect(result.username).toBe(uniqUsername);
      createdSalesIds.push(result.userId);

      // 验证密码正确
      const user = await userDao.findByUsername(uniqUsername);
      const passwordUtil = require('../src/utils/password');
      expect(await passwordUtil.compare('salespass123', user.password)).toBe(true);
    });

    test('createSales() 重复用户名应失败', async () => {
      await expect(
        adminService.createSales({
          username: 'sales01',
          password: 'test',
          realName: '重复销售',
        })
      ).rejects.toThrow('用户名已存在');
    });

    test('resetPassword() 成功重置销售员密码', async () => {
      // 创建临时销售人员用于测试，避免影响 sales01
      const uniqSales = `sales_reset_${Date.now()}`;
      const created = await adminService.createSales({
        username: uniqSales,
        password: 'temppass1',
        realName: '密码重置测试',
      });
      createdSalesIds.push(created.userId);

      const result = await adminService.resetPassword(created.userId);
      expect(result.newPassword).toBeDefined();
      expect(typeof result.newPassword).toBe('string');
      // 新密码应为 8位 hex
      expect(result.newPassword.length).toBe(8);

      // 验证新密码可用
      const user = await userDao.findByUsername(uniqSales);
      const passwordUtil = require('../src/utils/password');
      expect(await passwordUtil.compare(result.newPassword, user.password)).toBe(true);
    });

    test('resetPassword() 非销售用户返回 404', async () => {
      const adminUser = await userDao.findByUsername('admin');
      await expect(
        adminService.resetPassword(adminUser.id)
      ).rejects.toThrow('销售人员不存在');
    });

    test('deleteSales() 不存在的销售返回 404', async () => {
      await expect(
        adminService.deleteSales(99999)
      ).rejects.toThrow('销售人员不存在');
    });

    test('deleteSales() 删除无未完成订单的销售员', async () => {
      // 使用刚创建的销售 (无关联订单)
      if (createdSalesIds.length > 0) {
        const salesId = createdSalesIds[createdSalesIds.length - 1];
        // 从数组中移除，避免重复清理
        createdSalesIds = createdSalesIds.filter(id => id !== salesId);
        const result = await adminService.deleteSales(salesId);
        expect(result.salesId).toBe(salesId);
      }
    });
  });

  // ==========================================================
  // 订单查看
  // ==========================================================
  describe('listOrders() — 全部订单查看', () => {
    test('管理员可查看全部订单', async () => {
      const result = await adminService.listOrders({ page: 1, pageSize: 10 });
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.list)).toBe(true);
    });

    test('按状态筛选订单', async () => {
      const result = await adminService.listOrders({
        page: 1, pageSize: 10, status: 'pending',
      });
      result.list.forEach(o => {
        expect(o.status).toBe('pending');
      });
    });

    test('按关键词搜索订单', async () => {
      const result = await adminService.listOrders({
        page: 1, pageSize: 10, keyword: '2026',
      });
      expect(Array.isArray(result.list)).toBe(true);
    });
  });

  // ==========================================================
  // 出入库日志
  // ==========================================================
  describe('listInventoryLogs() — 出入库日志查看', () => {
    test('获取出入库日志列表', async () => {
      const result = await adminService.listInventoryLogs({ page: 1, pageSize: 10 });
      expect(Array.isArray(result.list)).toBe(true);
    });

    test('按类型筛选日志', async () => {
      const result = await adminService.listInventoryLogs({
        page: 1, pageSize: 10, type: 'in',
      });
      result.list.forEach(log => {
        expect(log.type).toBe('in');
      });
    });
  });

  // ==========================================================
  // 系统日志
  // ==========================================================
  describe('系统日志查询', () => {
    test('queryLogs() 查询系统日志', async () => {
      // 先写一条日志
      const conn = await pool.getConnection();
      await logService.writeLog({
        action: 'test_action',
        operatorId: adminUserId,
        targetType: 'test',
        targetId: 1,
        detail: { message: 'admin test log' },
      }, conn);
      conn.release();

      const result = await logService.queryLogs({ page: 1, pageSize: 20 });
      expect(result.total).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(result.list)).toBe(true);
    });

    test('queryLogs() 按操作类型筛选', async () => {
      const result = await logService.queryLogs({
        page: 1, pageSize: 10, action: 'test_action',
      });
      result.list.forEach(log => {
        expect(log.action).toBe('test_action');
      });
    });

    test('queryLogs() 无匹配结果', async () => {
      const result = await logService.queryLogs({
        page: 1, pageSize: 10, action: 'nonexistent_action_xyz',
      });
      expect(result.total).toBe(0);
      expect(result.list.length).toBe(0);
    });
  });
});
