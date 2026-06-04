/**
 * 库存模块集成测试
 * 覆盖: inventory.service.js (shelves CRUD, stock-in, stock-out, stockOutBatch, inventory queries)
 */

const inventoryService = require('../src/services/inventory.service');
const { userDao } = require('../src/dao/user.dao');
const { shelfDao, inventoryDao } = require('../src/dao/inventory.dao');
const pool = require('../src/config/db');

describe('库存模块 (services/inventory.service.js)', () => {
  let warehouseUserId;
  let createdShelfIds = [];

  beforeAll(async () => {
    const warehouseUser = await userDao.findByUsername('warehouse01');
    warehouseUserId = warehouseUser.id;
  });

  afterAll(async () => {
    // 清理测试货架
    for (const sid of createdShelfIds) {
      try {
        const conn = await pool.getConnection();
        await conn.query('UPDATE inventory SET shelf_id = NULL WHERE shelf_id = ?', [sid]);
        await conn.query('DELETE FROM shelf WHERE id = ?', [sid]);
        conn.release();
      } catch (e) { /* ignore */ }
    }
  }, 15000);

  // ==========================================================
  // 货架管理
  // ==========================================================
  describe('货架管理', () => {
    test('listShelves() 获取货架列表 (分页)', async () => {
      const result = await inventoryService.listShelves({ page: 1, pageSize: 5 });
      expect(result.list).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(10);
      expect(result.list.length).toBeLessThanOrEqual(5);
      result.list.forEach(s => {
        expect(s.shelf_code).toBeDefined();
      });
    });

    test('createShelf() 成功创建货架', async () => {
      const result = await inventoryService.createShelf({
        shelfCode: '99-1-1',
        description: '测试货架A',
      });
      expect(result.shelfId).toBeGreaterThan(0);
      createdShelfIds.push(result.shelfId);

      const shelf = await shelfDao.findById(result.shelfId);
      expect(shelf.shelf_code).toBe('99-1-1');
    });

    test('createShelf() 货架编号格式错误应失败', async () => {
      await expect(
        inventoryService.createShelf({ shelfCode: 'A-B-C', description: '非法编号' })
      ).rejects.toThrow('货架编号格式错误');

      await expect(
        inventoryService.createShelf({ shelfCode: '1-2', description: '段数不够' })
      ).rejects.toThrow('货架编号格式错误');
    });

    test('createShelf() 重复编号应失败', async () => {
      await expect(
        inventoryService.createShelf({ shelfCode: '99-1-1', description: '重复编号' })
      ).rejects.toThrow('货架编号已存在');
    });

    test('updateShelf() 成功更新货架', async () => {
      if (createdShelfIds.length > 0) {
        const result = await inventoryService.updateShelf(createdShelfIds[0], {
          shelfCode: '99-2-1',
          description: '更新后的货架',
        });
        expect(result.shelfCode).toBe('99-2-1');
      }
    });

    test('deleteShelf() 删除货架', async () => {
      const r1 = await inventoryService.createShelf({
        shelfCode: '98-1-1',
        description: '待删除货架',
      });
      const result = await inventoryService.deleteShelf(r1.shelfId);
      expect(result.shelfId).toBe(r1.shelfId);
    });

    test('deleteShelf() 有库存的货架不可删除', async () => {
      // 货架 1 有关联库存
      await expect(
        inventoryService.deleteShelf(1)
      ).rejects.toThrow('该货架尚有商品');
    });

    test('deleteShelf() 不存在的货架返回 404', async () => {
      await expect(
        inventoryService.deleteShelf(99999)
      ).rejects.toThrow('货架不存在');
    });
  });

  // ==========================================================
  // 库存查询
  // ==========================================================
  describe('库存查询', () => {
    test('listInventory() 获取库存列表', async () => {
      const result = await inventoryService.listInventory({ page: 1, pageSize: 10 });
      expect(result.total).toBeGreaterThanOrEqual(20);
      result.list.forEach(inv => {
        expect(inv.product_name).toBeDefined();
        expect(inv.quantity).toBeDefined();
      });
    });

    test('listInventory() 按分类筛选', async () => {
      const result = await inventoryService.listInventory({
        page: 1, pageSize: 20, category: '笔记本电脑',
      });
      result.list.forEach(inv => {
        expect(inv.category).toBe('笔记本电脑');
      });
    });

    test('listInventory() 库存状态筛选 — 低库存', async () => {
      const result = await inventoryService.listInventory({
        stockStatus: 'low_stock',
      });
      result.list.forEach(inv => {
        expect(inv.quantity).toBeLessThan(5);
        expect(inv.quantity).toBeGreaterThan(0);
      });
    });

    test('getInventoryDetail() 获取库存详情含出入库历史', async () => {
      const detail = await inventoryService.getInventoryDetail(1);
      expect(detail).toBeDefined();
      expect(detail.product_name).toBeDefined();
      expect(detail.quantity).toBeDefined();
      expect(Array.isArray(detail.logs)).toBe(true);
    });

    test('getInventoryDetail() 不存在的库存返回 404', async () => {
      await expect(
        inventoryService.getInventoryDetail(99999)
      ).rejects.toThrow('库存记录不存在');
    });
  });

  // ==========================================================
  // 入库操作
  // ==========================================================
  describe('入库操作', () => {
    test('stockIn() 成功入库', async () => {
      const testShelf = await inventoryService.createShelf({
        shelfCode: '97-1-1',
        description: '入库测试货架',
      });
      createdShelfIds.push(testShelf.shelfId);

      const result = await inventoryService.stockIn({
        productId: 1, shelfId: testShelf.shelfId, quantity: 10, remark: '测试入库',
      }, warehouseUserId);

      expect(result.productName).toBeDefined();
      expect(result.quantity).toBe(10);
      expect(result.afterQuantity).toBe(result.beforeQuantity + 10);
    });

    test('stockIn() 入库数量必须大于0', async () => {
      await expect(
        inventoryService.stockIn({
          productId: 1, shelfId: 1, quantity: 0, remark: '无效',
        }, warehouseUserId)
      ).rejects.toThrow('入库数量必须大于0');
    });

    test('stockIn() 商品不存在返回 404', async () => {
      await expect(
        inventoryService.stockIn({
          productId: 99999, shelfId: 1, quantity: 5,
        }, warehouseUserId)
      ).rejects.toThrow('商品不存在');
    });

    test('stockIn() 货架不存在返回 404', async () => {
      await expect(
        inventoryService.stockIn({
          productId: 1, shelfId: 99999, quantity: 5,
        }, warehouseUserId)
      ).rejects.toThrow('货架不存在');
    });
  });

  // ==========================================================
  // 出库操作
  // ==========================================================
  describe('出库操作', () => {
    test('stockOut() 成功出库', async () => {
      // 确保有足够库存
      await inventoryService.stockIn({
        productId: 2, shelfId: 1, quantity: 5,
      }, warehouseUserId);

      const result = await inventoryService.stockOut({
        productId: 2, quantity: 3, remark: '测试出库',
      }, warehouseUserId);

      expect(result.quantity).toBe(3);
      expect(result.afterQuantity).toBe(result.beforeQuantity - 3);
    });

    test('stockOut() 库存不足应失败', async () => {
      await expect(
        inventoryService.stockOut({
          productId: 2, quantity: 99999, remark: '超额出库',
        }, warehouseUserId)
      ).rejects.toThrow('库存不足');
    });

    test('stockOut() 出库数量必须大于0', async () => {
      await expect(
        inventoryService.stockOut({
          productId: 1, quantity: -1,
        }, warehouseUserId)
      ).rejects.toThrow('出库数量必须大于0');
    });

    test('stockOut() 商品不存在返回 404', async () => {
      await expect(
        inventoryService.stockOut({
          productId: 99999, quantity: 1,
        }, warehouseUserId)
      ).rejects.toThrow('商品不存在');
    });
  });

  // ==========================================================
  // 批量出库
  // ==========================================================
  describe('批量出库', () => {
    test('stockOutBatch() 不存在的订单返回 404', async () => {
      await expect(
        inventoryService.stockOutBatch(99999, warehouseUserId)
      ).rejects.toThrow('订单不存在');
    });
  });
});
