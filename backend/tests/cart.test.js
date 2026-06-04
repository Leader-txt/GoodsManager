/**
 * 购物车模块集成测试
 * 覆盖: cart.service.js (list, add, updateQuantity, remove, clearSelected)
 */

const cartService = require('../src/services/cart.service');
const authService = require('../src/services/auth.service');
const { userDao } = require('../src/dao/user.dao');
const cartDao = require('../src/dao/cart.dao');
const productDao = require('../src/dao/product.dao');
const pool = require('../src/config/db');

describe('购物车模块 (services/cart.service.js)', () => {
  let testUserId;
  const testPhone = `133${Date.now().toString().slice(-8)}`;
  const testIdCard = `444${Date.now().toString().slice(-14)}9`.replace(/\D/g, '0').slice(0, 17) + '9';

  beforeAll(async () => {
    const result = await authService.register({
      username: testPhone,
      password: 'cartTest123',
      realName: '购物车测试',
      gender: '男',
      idCard: testIdCard,
    });
    testUserId = result.userId;
  }, 10000);

  afterAll(async () => {
    // 清理购物车 + 用户
    const conn = await pool.getConnection();
    await conn.query('DELETE FROM cart WHERE user_id = ?', [testUserId]);
    await conn.query('DELETE FROM customer WHERE user_id = ?', [testUserId]);
    await conn.query('DELETE FROM user WHERE id = ?', [testUserId]);
    conn.release();
  }, 15000);

  beforeEach(async () => {
    // 每个测试前清空购物车
    const conn = await pool.getConnection();
    await conn.query('DELETE FROM cart WHERE user_id = ?', [testUserId]);
    conn.release();
  });

  // ==========================================================
  // 加入购物车
  // ==========================================================
  describe('add() — 加入购物车', () => {
    test('成功加入购物车', async () => {
      const result = await cartService.add(testUserId, {
        productId: 1, quantity: 1,
      });
      expect(result.productId).toBe(1);

      // 验证已加入
      const items = await cartService.list(testUserId);
      expect(items.length).toBe(1);
      expect(items[0].productId).toBe(1);
    });

    test('同一商品重复加入会合并数量', async () => {
      await cartService.add(testUserId, { productId: 1, quantity: 1 });
      await cartService.add(testUserId, { productId: 1, quantity: 2 });

      const items = await cartService.list(testUserId);
      expect(items.length).toBe(1);
      expect(items[0].quantity).toBe(3);
    });

    test('数量超出库存应失败', async () => {
      // 商品1 库存为 25
      await expect(
        cartService.add(testUserId, { productId: 1, quantity: 999 })
      ).rejects.toThrow('库存不足');
    });

    test('添加下架商品应失败', async () => {
      // 获取一个库存充足的商品进行下架测试
      const testPid = 20; // 使用较大ID的商品避免影响其他测试
      const conn = await pool.getConnection();
      const origStatus = (await conn.query('SELECT status FROM product WHERE id = ?', [testPid]))[0][0]?.status || 'on';
      await conn.query('UPDATE product SET status = ? WHERE id = ?', ['off', testPid]);
      conn.release();

      try {
        await expect(
          cartService.add(testUserId, { productId: testPid, quantity: 1 })
        ).rejects.toThrow('商品不存在或已下架');
      } finally {
        // 无论如何都恢复
        const conn2 = await pool.getConnection();
        await conn2.query('UPDATE product SET status = ? WHERE id = ?', [origStatus, testPid]);
        conn2.release();
      }
    });

    test('添加不存在的商品应失败', async () => {
      await expect(
        cartService.add(testUserId, { productId: 99999, quantity: 1 })
      ).rejects.toThrow('商品不存在或已下架');
    });

    test('数量小于1应失败', async () => {
      await expect(
        cartService.add(testUserId, { productId: 1, quantity: 0 })
      ).rejects.toThrow('数量至少为1');
    });
  });

  // ==========================================================
  // 购物车列表
  // ==========================================================
  describe('list() — 购物车列表', () => {
    test('空购物车返回空数组', async () => {
      const items = await cartService.list(testUserId);
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBe(0);
    });

    test('购物车列表包含商品详情', async () => {
      await cartService.add(testUserId, { productId: 1, quantity: 2 });
      await cartService.add(testUserId, { productId: 2, quantity: 1 });

      const items = await cartService.list(testUserId);
      expect(items.length).toBe(2);
      items.forEach(item => {
        expect(item.productName).toBeDefined();
        expect(item.price).toBeDefined();
        expect(item.productImage).toBeDefined();
        expect(item.stockQuantity).toBeDefined();
      });
    });
  });

  // ==========================================================
  // 修改购物车数量
  // ==========================================================
  describe('updateQuantity() — 修改数量', () => {
    let cartItemId;

    beforeEach(async () => {
      await cartService.add(testUserId, { productId: 1, quantity: 1 });
      const items = await cartService.list(testUserId);
      cartItemId = items[0].id;
    });

    test('成功修改数量', async () => {
      await cartService.updateQuantity(testUserId, cartItemId, 5);
      const items = await cartService.list(testUserId);
      expect(items[0].quantity).toBe(5);
    });

    test('数量超出库存应失败', async () => {
      await expect(
        cartService.updateQuantity(testUserId, cartItemId, 999)
      ).rejects.toThrow('库存不足');
    });

    test('修改不存在的购物车项返回 404', async () => {
      await expect(
        cartService.updateQuantity(testUserId, 99999, 1)
      ).rejects.toThrow('购物车项不存在');
    });

    test('数量小于1应失败', async () => {
      await expect(
        cartService.updateQuantity(testUserId, cartItemId, 0)
      ).rejects.toThrow('数量至少为1');
    });
  });

  // ==========================================================
  // 删除购物车项
  // ==========================================================
  describe('remove() — 删除购物车项', () => {
    test('成功删除购物车项', async () => {
      await cartService.add(testUserId, { productId: 1, quantity: 1 });
      const items = await cartService.list(testUserId);
      expect(items.length).toBe(1);

      await cartService.remove(testUserId, items[0].id);
      const after = await cartService.list(testUserId);
      expect(after.length).toBe(0);
    });

    test('删除不存在的项返回 404', async () => {
      await expect(
        cartService.remove(testUserId, 99999)
      ).rejects.toThrow('购物车项不存在');
    });
  });

  // ==========================================================
  // 清空已选
  // ==========================================================
  describe('clearSelected() — 清空已选', () => {
    test('成功清空指定购物车项', async () => {
      await cartService.add(testUserId, { productId: 1, quantity: 1 });
      await cartService.add(testUserId, { productId: 2, quantity: 1 });
      const items = await cartService.list(testUserId);
      const ids = items.map(i => i.id);

      const result = await cartService.clearSelected(testUserId, ids);
      expect(result.removed).toBe(2);

      const after = await cartService.list(testUserId);
      expect(after.length).toBe(0);
    });

    test('空 ID 数组应失败', async () => {
      await expect(
        cartService.clearSelected(testUserId, [])
      ).rejects.toThrow('请选择要清空的商品');
    });
  });
});
