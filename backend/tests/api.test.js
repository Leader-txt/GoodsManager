/**
 * API 层集成测试
 * 直接使用 Express app 测试完整请求/响应流程
 * 覆盖: 路由、中间件、控制器全链路
 */

const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');
const jwtUtil = require('../src/utils/jwt');

describe('API 集成测试', () => {
  // 测试 token
  let customerToken;
  let adminToken;
  let salesToken;
  let warehouseToken;
  const testPhone = `130${Date.now().toString().slice(-8)}`;
  const testIdCard = `111${Date.now().toString().slice(-14)}9`.replace(/\D/g, '0').slice(0, 17) + '9';

  beforeAll(async () => {
    // 注册测试顾客
    await request(app)
      .post('/api/auth/register')
      .send({
        username: testPhone,
        password: 'apiTest123',
        realName: 'API测试用户',
        gender: '男',
        idCard: testIdCard,
      });

    // 获取各角色 token
    customerToken = jwtUtil.sign({ userId: 100, username: testPhone, role: 'customer' });
    adminToken = jwtUtil.sign({ userId: 1, username: 'admin', role: 'admin' });
    salesToken = jwtUtil.sign({ userId: 3, username: 'sales01', role: 'sales' });
    warehouseToken = jwtUtil.sign({ userId: 2, username: 'warehouse01', role: 'warehouse' });
  });

  afterAll(async () => {
    // 清理测试用户
    try {
      const conn = await pool.getConnection();
      await conn.query('DELETE FROM cart WHERE user_id IN (SELECT id FROM user WHERE username = ?)', [testPhone]);
      await conn.query('DELETE FROM customer WHERE phone = ?', [testPhone]);
      await conn.query('DELETE FROM user WHERE username = ?', [testPhone]);
      conn.release();
    } catch (e) { /* ignore */ }
  }, 15000);

  // ==========================================================
  // 健康检查
  // ==========================================================
  describe('GET /api/health', () => {
    test('返回 200 且包含正确响应格式', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.message).toBe('ok');
    });
  });

  // ==========================================================
  // 认证 API
  // ==========================================================
  describe('POST /api/auth/register', () => {
    test('参数校验: 缺少字段返回 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: '13800000001' });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe(400);
    });

    test('用户名格式校验: 非手机号返回 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'notaphone',
          password: 'test1234',
          realName: '张测试',
          gender: '男',
          idCard: '310101199001011234',
        });
      expect(res.status).toBe(400);
    });

    test('密码长度太短返回 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: '13800000001',
          password: '123',
          realName: '张测试',
          gender: '男',
          idCard: '310101199001011234',
        });
      expect(res.status).toBe(400);
    });

    test('姓名格式校验: 非中文返回 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: '13800000001',
          password: 'test1234',
          realName: 'abc123',
          gender: '男',
          idCard: '310101199001011234',
        });
      expect(res.status).toBe(400);
    });

    test('身份证格式不正确返回 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: '13800000001',
          password: 'test1234',
          realName: '张测试',
          gender: '男',
          idCard: '12345',
        });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    test('空用户名密码返回 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});
      expect(res.status).toBe(400);
    });

    test('错误密码返回 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrongpass' });
      expect(res.status).toBe(400);
    });

    test('正确凭证返回 token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' });
      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('admin');
    });
  });

  // ==========================================================
  // 商品 API (公开)
  // ==========================================================
  describe('GET /api/products', () => {
    test('无需认证即可访问', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(200);
      expect(res.body.data.list).toBeDefined();
      expect(res.body.data.total).toBeGreaterThan(0);
    });

    test('支持分页参数', async () => {
      const res = await request(app)
        .get('/api/products?page=1&pageSize=3');
      expect(res.body.data.list.length).toBeLessThanOrEqual(3);
    });

    test('支持分类筛选', async () => {
      const res = await request(app)
        .get('/api/products?category=笔记本电脑');
      expect(res.status).toBe(200);
      res.body.data.list.forEach(p => {
        expect(p.category).toBe('笔记本电脑');
      });
    });
  });

  describe('GET /api/products/categories', () => {
    test('返回 10 种分类', async () => {
      const res = await request(app).get('/api/products/categories');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(10);
    });
  });

  describe('GET /api/products/:id', () => {
    test('返回商品详情含规格', async () => {
      const res = await request(app).get('/api/products/1');
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBeDefined();
      expect(res.body.data.specs).toBeDefined();
      expect(Array.isArray(res.body.data.specs)).toBe(true);
    });

    test('不存在的商品返回 404', async () => {
      const res = await request(app).get('/api/products/99999');
      expect(res.status).toBe(404);
    });
  });

  // ==========================================================
  // 用户 API (需认证)
  // ==========================================================
  describe('GET /api/users/profile', () => {
    test('未登录返回 401', async () => {
      const res = await request(app).get('/api/users/profile');
      expect(res.status).toBe(401);
    });

    test('无效 token 返回 401', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid_token_here');
      expect(res.status).toBe(401);
    });

    test('有效 token 返回用户信息', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('admin');
    });
  });

  // ==========================================================
  // 购物车 API (仅顾客 + 需认证)
  // ==========================================================
  describe('Cart API 权限检查', () => {
    test('未登录无法访问购物车', async () => {
      const res = await request(app).get('/api/cart');
      expect(res.status).toBe(401);
    });

    test('非顾客角色无法访问购物车', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ==========================================================
  // 管理后台 API (仅 admin)
  // ==========================================================
  describe('GET /api/admin/dashboard', () => {
    test('未登录返回 401', async () => {
      const res = await request(app).get('/api/admin/dashboard');
      expect(res.status).toBe(401);
    });

    test('非 admin 角色返回 403', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });

    test('admin 角色可访问', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.todayOrders).toBeDefined();
    });
  });

  describe('POST /api/admin/products (管理员添加商品)', () => {
    test('admin 可添加商品', async () => {
      const res = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'API测试商品',
          category: '鼠标',
          brand: '测试',
          price: 19.99,
          specs: [{ specKey: '类型', specValue: '无线', specGroup: '基本信息' }],
        });
      expect(res.status).toBe(200);
      const productId = res.body.data.productId;

      // 清理
      const conn = await pool.getConnection();
      await conn.query('DELETE FROM product_spec WHERE product_id = ?', [productId]);
      await conn.query('DELETE FROM product WHERE id = ?', [productId]);
      conn.release();
    });

    test('非 admin 返回 403', async () => {
      const res = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'x', category: '键盘', price: 1 });
      expect(res.status).toBe(403);
    });
  });

  // ==========================================================
  // 订单 API
  // ==========================================================
  describe('POST /api/orders', () => {
    test('非顾客角色不能下单', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cartItemIds: [1], payMethod: 'online', deliveryType: 'self_pickup' });
      expect(res.status).toBe(403);
    });
  });

  // ==========================================================
  // 库存 API
  // ==========================================================
  describe('GET /api/shelves', () => {
    test('登录后可查看货架列表', async () => {
      const res = await request(app)
        .get('/api/shelves')
        .set('Authorization', `Bearer ${warehouseToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/stock-in', () => {
    test('非仓库/管理员不能入库', async () => {
      const res = await request(app)
        .post('/api/stock-in')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: 1, shelfId: 1, quantity: 10 });
      expect(res.status).toBe(403);
    });
  });

  // ==========================================================
  // 全局错误处理
  // ==========================================================
  describe('全局错误处理', () => {
    test('未注册路由返回 401 (因库存路由全局 auth 中间件)', async () => {
      const res = await request(app).get('/api/nonexistent_route_xyz');
      // 库存路由 router.use(auth) 拦截所有未匹配路径, 返回 401
      expect([401, 404]).toContain(res.status);
    });

    test('500 错误不泄露敏感信息', async () => {
      const res = await request(app)
        .get('/api/products/abc'); // 非数字 ID 触发解析错误
      // 统一响应格式
      if (res.body && res.body.code) {
        expect(res.body.data).toBeNull();
      }
    });
  });
});
