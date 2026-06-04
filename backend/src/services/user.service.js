const pool = require('../config/db');
const { userDao, customerDao } = require('../dao/user.dao');
const passwordUtil = require('../utils/password');
const crypto = require('crypto');

const userService = {
  /**
   * 获取个人信息
   */
  async getProfile(userId) {
    const user = await userDao.findById(userId);
    if (!user) {
      throw Object.assign(new Error('用户不存在'), { statusCode: 404 });
    }
    const customer = await customerDao.findByUserId(userId);
    return {
      userId: user.id,
      username: user.username,
      role: user.role,
      realName: customer?.real_name || '',
      gender: customer?.gender || '',
      idCard: customer?.id_card || '',
      phone: customer?.phone || '',
      address: customer?.address || '',
    };
  },

  /**
   * 修改手机号
   */
  async updatePhone(userId, phone) {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      throw Object.assign(new Error('手机号格式不正确'), { statusCode: 400 });
    }
    await customerDao.updatePhone(userId, phone);
    return { phone };
  },

  /**
   * 修改收货地址
   */
  async updateAddress(userId, address) {
    if (!address || address.trim().length === 0) {
      throw Object.assign(new Error('收货地址不能为空'), { statusCode: 400 });
    }
    await customerDao.updateAddress(userId, address.trim());
    return { address: address.trim() };
  },

  /**
   * 线下注册顾客 (销售人员操作)
   */
  async offlineRegister({ realName, gender, idCard, phone }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 校验身份证号唯一
      const existingCard = await customerDao.findByIdCard(idCard, conn);
      if (existingCard) {
        throw Object.assign(new Error('该身份证号已注册'), { statusCode: 400 });
      }

      // 自动生成用户名
      let username;
      if (phone) {
        username = phone;
      } else {
        username = idCard.slice(-8) + crypto.randomBytes(1).toString('hex');
      }

      // 检查用户名唯一性
      const existingUser = await userDao.findByUsername(username, conn);
      if (existingUser) {
        username = username + crypto.randomBytes(1).toString('hex');
      }

      // 初始密码: 身份证号后6位
      const initialPassword = idCard.slice(-6);
      const hashedPassword = await passwordUtil.hash(initialPassword);

      // 创建 user
      const userId = await userDao.create({
        username,
        password: hashedPassword,
        role: 'customer',
      }, conn);

      // 创建 customer
      await customerDao.create({
        userId,
        realName,
        gender,
        idCard,
        phone: phone || '',
        address: null,
      }, conn);

      await conn.commit();
      return { userId, username, initialPassword };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
};

module.exports = userService;
