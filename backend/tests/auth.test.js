/**
 * 认证模块集成测试
 * 覆盖: auth.service.js (register, login)
 * 注意: 测试使用真实数据库, 每个测试前后清理数据
 */

const authService = require('../src/services/auth.service');
const { userDao, customerDao } = require('../src/dao/user.dao');
const pool = require('../src/config/db');

describe('认证模块 (services/auth.service.js)', () => {
  // 测试数据前缀, 用于清理
  const TEST_PREFIX = '_test_auth_';
  let createdUserIds = [];

  afterAll(async () => {
    // 清理所有测试数据
    for (const uid of createdUserIds) {
      try {
        const conn = await pool.getConnection();
        await conn.query('DELETE FROM customer WHERE user_id = ?', [uid]);
        await conn.query('DELETE FROM user WHERE id = ?', [uid]);
        conn.release();
      } catch (e) { /* ignore */ }
    }
  }, 15000);

  // ==========================================================
  // 注册测试
  // ==========================================================
  describe('register() — 顾客注册', () => {
    const testPhone = `138${Date.now().toString().slice(-8)}`;
    const testIdCard = `${Date.now().toString().slice(-17)}9`;

    test('成功注册新顾客', async () => {
      const result = await authService.register({
        username: testPhone,
        password: 'test123456',
        realName: '测试用户A',
        gender: '男',
        idCard: testIdCard,
      });
      expect(result).toBeDefined();
      expect(result.userId).toBeGreaterThan(0);
      expect(result.username).toBe(testPhone);
      expect(result.role).toBe('customer');
      createdUserIds.push(result.userId);
    });

    test('用户名重复注册应失败', async () => {
      await expect(
        authService.register({
          username: testPhone,
          password: 'test123456',
          realName: '重复用户',
          gender: '女',
          idCard: `X${Date.now().toString().slice(-16)}9`.replace(/\D/g, '0').slice(0, 17) + '9',
        })
      ).rejects.toThrow('用户名已被注册');
    });

    test('身份证号重复注册应失败', async () => {
      await expect(
        authService.register({
          username: `139${Date.now().toString().slice(-8)}`,
          password: 'test123456',
          realName: '重复证件',
          gender: '女',
          idCard: testIdCard,
        })
      ).rejects.toThrow('该身份证号已注册');
    });

    test('缺少必填参数应失败 (用户名)', async () => {
      await expect(
        authService.register({
          password: 'test123456',
          realName: '测试用户',
          gender: '男',
          idCard: '123456789012345678',
        })
      ).rejects.toThrow();
    });

    test('注册时密码应被加密', async () => {
      const phone = `150${Date.now().toString().slice(-8)}`;
      const idCard = `555${Date.now().toString().slice(-14)}9`.replace(/\D/g, '0').slice(0, 17) + '9';
      const result = await authService.register({
        username: phone,
        password: 'encryptTest',
        realName: '密码加密测试',
        gender: '女',
        idCard,
      });
      createdUserIds.push(result.userId);

      const user = await userDao.findByUsername(phone);
      expect(user.password).not.toBe('encryptTest');
      expect(user.password.startsWith('$2b$')).toBe(true);
    });
  });

  // ==========================================================
  // 登录测试
  // ==========================================================
  describe('login() — 用户登录', () => {
    const loginPhone = `186${Date.now().toString().slice(-8)}`;
    const loginIdCard = `888${Date.now().toString().slice(-14)}9`.replace(/\D/g, '0').slice(0, 17) + '9';
    const loginPassword = 'login123456';
    let loginUserId;

    beforeAll(async () => {
      const result = await authService.register({
        username: loginPhone,
        password: loginPassword,
        realName: '登录测试用户',
        gender: '男',
        idCard: loginIdCard,
      });
      loginUserId = result.userId;
      createdUserIds.push(loginUserId);
    });

    test('使用正确密码登录成功', async () => {
      const result = await authService.login({
        username: loginPhone,
        password: loginPassword,
      });
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.user.username).toBe(loginPhone);
      expect(result.user.role).toBe('customer');
      expect(result.user.id).toBe(loginUserId);
    });

    test('错误密码登录失败', async () => {
      await expect(
        authService.login({ username: loginPhone, password: 'wrongpass' })
      ).rejects.toThrow('密码错误');
    });

    test('不存在的用户名登录失败', async () => {
      await expect(
        authService.login({ username: 'nonexistent_999', password: 'somepass' })
      ).rejects.toThrow('用户名不存在');
    });

    test('预置管理员账号可正常登录', async () => {
      const result = await authService.login({
        username: 'admin',
        password: 'admin123',
      });
      expect(result.token).toBeDefined();
      expect(result.user.role).toBe('admin');
    });

    test('预置仓库操作员可正常登录', async () => {
      const result = await authService.login({
        username: 'warehouse01',
        password: 'abc123',
      });
      expect(result.token).toBeDefined();
      expect(result.user.role).toBe('warehouse');
    });

    test('预置销售人员可正常登录', async () => {
      const result = await authService.login({
        username: 'sales01',
        password: 'abc123',
      });
      expect(result.token).toBeDefined();
      expect(result.user.role).toBe('sales');
    });

    test('JWT token 不同用户内容不同', async () => {
      const r1 = await authService.login({ username: 'admin', password: 'admin123' });
      const r2 = await authService.login({ username: 'sales01', password: 'abc123' });
      expect(r1.token).not.toBe(r2.token);
    });
  });
});
