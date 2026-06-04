/**
 * 商品模块集成测试
 * 覆盖: product.service.js (list, detail, create, update, updateStatus, delete)
 */

const productService = require('../src/services/product.service');
const pool = require('../src/config/db');

describe('商品模块 (services/product.service.js)', () => {
  let createdProductIds = [];

  afterAll(async () => {
    // 清理测试商品
    for (const pid of createdProductIds) {
      try {
        const conn = await pool.getConnection();
        await conn.query('DELETE FROM product_spec WHERE product_id = ?', [pid]);
        await conn.query('DELETE FROM product WHERE id = ?', [pid]);
        conn.release();
      } catch (e) { /* ignore */ }
    }
  }, 15000);

  // ==========================================================
  // 商品列表
  // ==========================================================
  describe('list() — 商品列表查询', () => {
    test('获取第1页商品列表 (默认分页)', async () => {
      const result = await productService.list({ page: 1, pageSize: 5 });
      expect(result.list).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(20);
      expect(result.list.length).toBeLessThanOrEqual(5);
      result.list.forEach(p => {
        expect(p.status).toBe('on');
        expect(p.stock_quantity).toBeDefined();
      });
    });

    test('下架商品不在列表中', async () => {
      const result = await productService.list({ page: 1, pageSize: 100 });
      result.list.forEach(p => {
        expect(p.status).toBe('on');
      });
    });

    test('按分类筛选', async () => {
      const result = await productService.list({
        page: 1, pageSize: 20, category: '笔记本电脑',
      });
      result.list.forEach(p => {
        expect(p.category).toBe('笔记本电脑');
      });
    });

    test('按关键词搜索', async () => {
      const result = await productService.list({
        page: 1, pageSize: 20, keyword: '拯救者',
      });
      expect(result.list.length).toBeGreaterThan(0);
      result.list.forEach(p => {
        expect(p.name).toMatch(/拯救者/);
      });
    });

    test('价格升序排序', async () => {
      const result = await productService.list({
        page: 1, pageSize: 20, sort: 'price_asc',
      });
      const prices = result.list.map(p => p.price);
      const sorted = [...prices].sort((a, b) => a - b);
      expect(prices).toEqual(sorted);
    });

    test('价格降序排序', async () => {
      const result = await productService.list({
        page: 1, pageSize: 20, sort: 'price_desc',
      });
      const prices = result.list.map(p => p.price);
      const sorted = [...prices].sort((a, b) => b - a);
      expect(prices).toEqual(sorted);
    });

    test('分页边界: 超出范围返回空列表', async () => {
      const result = await productService.list({ page: 999, pageSize: 10 });
      expect(result.list).toHaveLength(0);
    });
  });

  // ==========================================================
  // 商品详情
  // ==========================================================
  describe('detail() — 商品详情', () => {
    test('获取商品详情包含规格参数', async () => {
      const product = await productService.detail(1);
      expect(product.name).toBeDefined();
      expect(product.specs).toBeDefined();
      expect(product.specs.length).toBeGreaterThan(0);
      expect(product.stock_quantity).toBeDefined();
      // 规格包含 specKey, specValue, specGroup
      product.specs.forEach(s => {
        expect(s.spec_key).toBeDefined();
        expect(s.spec_value).toBeDefined();
        expect(s.spec_group).toBeDefined();
      });
    });

    test('不存在的商品返回 404', async () => {
      await expect(
        productService.detail(99999)
      ).rejects.toThrow('商品不存在');
    });
  });

  // ==========================================================
  // 管理员: 添加商品
  // ==========================================================
  describe('create() — 添加商品', () => {
    test('成功添加商品含规格参数', async () => {
      const result = await productService.create({
        name: '测试商品-笔记本电脑',
        category: '笔记本电脑',
        brand: '测试品牌',
        price: 5999.00,
        imageUrl: '/uploads/test.jpg',
        specs: [
          { specKey: '处理器', specValue: 'Test i7', specGroup: '核心配置' },
          { specKey: '内存', specValue: '16GB', specGroup: '核心配置' },
        ],
      });
      expect(result.productId).toBeGreaterThan(0);
      createdProductIds.push(result.productId);

      // 验证创建成功
      const product = await productService.detail(result.productId);
      expect(product.name).toBe('测试商品-笔记本电脑');
      expect(product.specs).toHaveLength(2);
    });

    test('缺少必填参数应失败', async () => {
      await expect(
        productService.create({ name: 'No Price', category: '智能手机' })
      ).rejects.toThrow('缺少必填参数');
    });

    test('不指定规格参数也能创建', async () => {
      const result = await productService.create({
        name: '无规格测试商品',
        category: '键盘',
        brand: '无品牌',
        price: 29.99,
      });
      expect(result.productId).toBeGreaterThan(0);
      createdProductIds.push(result.productId);

      const product = await productService.detail(result.productId);
      expect(product.specs).toHaveLength(0);
    });
  });

  // ==========================================================
  // 管理员: 编辑商品
  // ==========================================================
  describe('update() — 编辑商品', () => {
    let editProductId;

    beforeAll(async () => {
      const r = await productService.create({
        name: '待编辑商品', category: '鼠标', brand: '测试', price: 88.00,
        specs: [{ specKey: 'DPI', specValue: '1200', specGroup: '性能' }],
      });
      editProductId = r.productId;
      createdProductIds.push(editProductId);
    });

    test('成功编辑商品名称和价格', async () => {
      const result = await productService.update(editProductId, {
        name: '已编辑商品', category: '鼠标', brand: '新品牌', price: 99.00,
      });
      expect(result.productId).toBe(editProductId);

      const product = await productService.detail(editProductId);
      expect(product.name).toBe('已编辑商品');
      expect(product.price).toBe('99.00');
      expect(product.brand).toBe('新品牌');
    });

    test('编辑规格参数 (替换)', async () => {
      await productService.update(editProductId, {
        name: '规格已更新', category: '鼠标', brand: '测试', price: 88.00,
        specs: [
          { specKey: 'DPI', specValue: '2400', specGroup: '性能' },
          { specKey: '连接', specValue: '无线', specGroup: '连接' },
        ],
      });
      const product = await productService.detail(editProductId);
      expect(product.specs).toHaveLength(2);
      expect(product.specs.find(s => s.spec_key === 'DPI').spec_value).toBe('2400');
      expect(product.specs.find(s => s.spec_key === '连接').spec_value).toBe('无线');
    });

    test('编辑不存在的商品返回 404', async () => {
      await expect(
        productService.update(99999, { name: 'x', category: '键盘', price: 0 })
      ).rejects.toThrow('商品不存在');
    });
  });

  // ==========================================================
  // 管理员: 上架/下架
  // ==========================================================
  describe('updateStatus() — 上架/下架', () => {
    let statusTestProductId;

    beforeAll(async () => {
      const r = await productService.create({
        name: '上架下架测试商品',
        category: '键盘',
        brand: '测试',
        price: 10.00,
      });
      statusTestProductId = r.productId;
      createdProductIds.push(statusTestProductId);
    });

    test('成功下架商品', async () => {
      const result = await productService.updateStatus(statusTestProductId, 'off');
      expect(result.status).toBe('off');
    });

    test('重新上架商品', async () => {
      const result = await productService.updateStatus(statusTestProductId, 'on');
      expect(result.status).toBe('on');
    });

    test('无效状态值应失败', async () => {
      await expect(
        productService.updateStatus(statusTestProductId, 'invalid')
      ).rejects.toThrow('状态值无效');
    });

    test('下架不存在的商品返回 404', async () => {
      await expect(
        productService.updateStatus(99999, 'off')
      ).rejects.toThrow('商品不存在');
    });
  });

  // ==========================================================
  // 管理员: 删除商品
  // ==========================================================
  describe('delete() — 删除商品', () => {
    test('成功删除无关联订单的商品', async () => {
      const r = await productService.create({
        name: '待删除商品', category: '键盘', brand: '测试', price: 1.00,
      });
      const result = await productService.delete(r.productId);
      expect(result.productId).toBe(r.productId);
      // 不应出现在 createdProductIds 清理列表中 (已手动删除)
    });

    test('删除不存在的商品返回 404', async () => {
      await expect(
        productService.delete(99999)
      ).rejects.toThrow('商品不存在');
    });
  });

  // ==========================================================
  // 分类列表
  // ==========================================================
  describe('getCategories() — 商品分类列表', () => {
    test('返回 10 种商品分类', () => {
      const categories = productService.getCategories();
      expect(categories).toHaveLength(10);
      expect(categories).toContain('笔记本电脑');
      expect(categories).toContain('智能手机');
      expect(categories).toContain('鼠标');
    });
  });
});
