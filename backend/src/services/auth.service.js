const pool = require('../config/db');
const { userDao, customerDao } = require('../dao/user.dao');
const passwordUtil = require('../utils/password');
const jwtUtil = require('../utils/jwt');

const authService = {
  /**
   * 顾客线上注册
   * 事务: user + customer 同时创建
   */
  async register({ username, password, realName, gender, idCard, phone }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 校验用户名唯一
      const existingUser = await userDao.findByUsername(username, conn);
      if (existingUser) {
        throw Object.assign(new Error('用户名已被注册'), { statusCode: 400 });
      }

      // 校验身份证号唯一
      const existingCard = await customerDao.findByIdCard(idCard, conn);
      if (existingCard) {
        throw Object.assign(new Error('该身份证号已注册'), { statusCode: 400 });
      }

      // 密码加密
      const hashedPassword = await passwordUtil.hash(password);

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
        phone: phone || username,
        address: null,
      }, conn);

      await conn.commit();
      return { userId, username, role: 'customer' };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * 用户登录
   * 验证用户名密码，返回 JWT Token
   */
  async login({ username, password }) {
    const user = await userDao.findByUsername(username);
    if (!user) {
      throw Object.assign(new Error('用户名不存在'), { statusCode: 400 });
    }

    const valid = await passwordUtil.compare(password, user.password);
    if (!valid) {
      throw Object.assign(new Error('密码错误'), { statusCode: 400 });
    }

    const payload = { userId: user.id, username: user.username, role: user.role };
    const token = jwtUtil.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  },
};

module.exports = authService;
