/**
 * 用户模块集成测试
 * 覆盖: user.service.js (getProfile, updatePhone, updateAddress, offlineRegister)
 */

const userService = require('../src/services/user.service');
const authService = require('../src/services/auth.service');
const { userDao } = require('../src/dao/user.dao');
const pool = require('../src/config/db');

describe('用户模块 (services/user.service.js)', () => {
  let testUserId;
  let testCustomerId;
  const testPhone = `158${Date.now().toString().slice(-8)}`;
  const testIdCard = `333${Date.now().toString().slice(-14)}9`.replace(/\D/g, '0').slice(0, 17) + '9';

  beforeAll(async () => {
    // 创建测试用户
    const result = await authService.register({
      username: testPhone,
      password: 'userTest123',
      realName: '个人信息测试',
      gender: '女',
      idCard: testIdCard,
    });
    testUserId = result.userId;
  }, 10000);

  afterAll(async () => {
    try {
      const conn = await pool.getConnection();
      await conn.query('DELETE FROM customer WHERE user_id = ?', [testUserId]);
      await conn.query('DELETE FROM user WHERE id = ?', [testUserId]);
      conn.release();
    } catch (e) { /* ignore */ }
  }, 15000);

  // ==========================================================
  // 个人信息查询
  // ==========================================================
  describe('getProfile() — 查看个人信息', () => {
    test('成功获取个人信息', async () => {
      const profile = await userService.getProfile(testUserId);
      expect(profile.userId).toBe(testUserId);
      expect(profile.username).toBe(testPhone);
      expect(profile.role).toBe('customer');
      expect(profile.realName).toBe('个人信息测试');
      expect(profile.gender).toBe('女');
      expect(profile.idCard).toBe(testIdCard);
    });

    test('不存在的用户返回 404', async () => {
      await expect(
        userService.getProfile(99999)
      ).rejects.toThrow('用户不存在');
    });

    test('admin 用户可获取 profile (JSON 输出无密码)', async () => {
      const adminUser = await userDao.findByUsername('admin');
      const profile = await userService.getProfile(adminUser.id);
      expect(profile).not.toHaveProperty('password');
      expect(profile.role).toBe('admin');
    });
  });

  // ==========================================================
  // 修改手机号
  // ==========================================================
  describe('updatePhone() — 修改手机号', () => {
    test('成功修改手机号', async () => {
      const newPhone = `159${Date.now().toString().slice(-8)}`;
      const result = await userService.updatePhone(testUserId, newPhone);
      expect(result.phone).toBe(newPhone);

      // 验证已更新
      const profile = await userService.getProfile(testUserId);
      expect(profile.phone).toBe(newPhone);
    });

    test('无效手机号格式应失败', async () => {
      await expect(
        userService.updatePhone(testUserId, '12345678901') // 不以 1[3-9] 开头
      ).rejects.toThrow('手机号格式不正确');
    });

    test('空手机号应失败', async () => {
      await expect(
        userService.updatePhone(testUserId, '')
      ).rejects.toThrow('手机号格式不正确');
    });
  });

  // ==========================================================
  // 修改收货地址
  // ==========================================================
  describe('updateAddress() — 修改收货地址', () => {
    test('成功修改收货地址', async () => {
      const newAddress = '北京市朝阳区建国路100号';
      const result = await userService.updateAddress(testUserId, newAddress);
      expect(result.address).toBe(newAddress);

      // 验证已更新
      const profile = await userService.getProfile(testUserId);
      expect(profile.address).toBe(newAddress);
    });

    test('空地址应失败', async () => {
      await expect(
        userService.updateAddress(testUserId, '')
      ).rejects.toThrow('收货地址不能为空');
    });

    test('纯空格地址应失败', async () => {
      await expect(
        userService.updateAddress(testUserId, '   ')
      ).rejects.toThrow('收货地址不能为空');
    });

    test('更新地址自动去除首尾空格', async () => {
      const result = await userService.updateAddress(testUserId, '  上海市徐汇区漕溪路280号  ');
      expect(result.address).toBe('上海市徐汇区漕溪路280号');
      const profile = await userService.getProfile(testUserId);
      expect(profile.address).toBe('上海市徐汇区漕溪路280号');
    });
  });

  // ==========================================================
  // 线下注册 (sales)
  // ==========================================================
  describe('offlineRegister() — 线下注册', () => {
    const offIdCard = `777${Date.now().toString().slice(-14)}9`.replace(/\D/g, '0').slice(0, 17) + '9';
    const offPhone = `177${Date.now().toString().slice(-8)}`;
    let offUserId;

    afterAll(async () => {
      if (offUserId) {
        try {
          const conn = await pool.getConnection();
          await conn.query('DELETE FROM customer WHERE user_id = ?', [offUserId]);
          await conn.query('DELETE FROM user WHERE id = ?', [offUserId]);
          conn.release();
        } catch (e) { /* ignore */ }
      }
    });

    test('销售人员成功为顾客线下注册', async () => {
      const result = await userService.offlineRegister({
        realName: '线下注册测试',
        gender: '男',
        idCard: offIdCard,
        phone: offPhone,
      });
      expect(result.userId).toBeGreaterThan(0);
      expect(result.initialPassword).toBe(offIdCard.slice(-6));
      offUserId = result.userId;

      // 验证用户创建
      const user = await userDao.findById(offUserId);
      expect(user.role).toBe('customer');
    });

    test('身份证号重复线下注册应失败', async () => {
      await expect(
        userService.offlineRegister({
          realName: '重复注册',
          gender: '女',
          idCard: offIdCard,
          phone: `188${Date.now().toString().slice(-8)}`,
        })
      ).rejects.toThrow('该身份证号已注册');
    });

    test('无手机号时用身份证号生成用户名', async () => {
      const idCard2 = `999${Date.now().toString().slice(-14)}9`.replace(/\D/g, '0').slice(0, 17) + '9';
      const result = await userService.offlineRegister({
        realName: '无手机号注册',
        gender: '男',
        idCard: idCard2,
      });
      expect(result.userId).toBeGreaterThan(0);
      // 初始密码为身份证后6位
      expect(result.initialPassword).toBe(idCard2.slice(-6));

      // 清理
      try {
        const conn = await pool.getConnection();
        await conn.query('DELETE FROM customer WHERE user_id = ?', [result.userId]);
        await conn.query('DELETE FROM user WHERE id = ?', [result.userId]);
        conn.release();
      } catch (e) { /* ignore */ }
    });
  });
});
