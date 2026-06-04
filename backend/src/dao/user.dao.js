const pool = require('../config/db');

const userDao = {
  /** 按用户名查找用户 */
  async findByUsername(username, conn) {
    const db = conn || pool;
    const [rows] = await db.query('SELECT * FROM `user` WHERE username = ?', [username]);
    return rows[0] || null;
  },

  /** 按 ID 查找用户 */
  async findById(userId, conn) {
    const db = conn || pool;
    const [rows] = await db.query(
      'SELECT id, username, role, created_at FROM `user` WHERE id = ?',
      [userId]
    );
    return rows[0] || null;
  },

  /** 创建用户 */
  async create({ username, password, role }, conn) {
    const db = conn || pool;
    const [result] = await db.query(
      'INSERT INTO `user` (username, password, role) VALUES (?, ?, ?)',
      [username, password, role]
    );
    return result.insertId;
  },

  /** 更新密码 */
  async updatePassword(userId, password, conn) {
    const db = conn || pool;
    await db.query('UPDATE `user` SET password = ? WHERE id = ?', [password, userId]);
  },

  /** 删除用户 */
  async deleteById(userId, conn) {
    const db = conn || pool;
    await db.query('DELETE FROM `user` WHERE id = ?', [userId]);
  },

  /** 按角色查找用户列表 */
  async findByRole(role, { page = 1, pageSize = 10 }, conn) {
    const db = conn || pool;
    const offset = (page - 1) * pageSize;
    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) as total FROM `user` WHERE role = ?', [role]
    );
    const [rows] = await db.query(
      'SELECT id, username, role, created_at FROM `user` WHERE role = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [role, pageSize, offset]
    );
    return { total, list: rows };
  },
};

const customerDao = {
  /** 按用户 ID 查顾客信息 */
  async findByUserId(userId, conn) {
    const db = conn || pool;
    const [rows] = await db.query('SELECT * FROM `customer` WHERE user_id = ?', [userId]);
    return rows[0] || null;
  },

  /** 按身份证号查顾客信息 */
  async findByIdCard(idCard, conn) {
    const db = conn || pool;
    const [rows] = await db.query('SELECT * FROM `customer` WHERE id_card = ?', [idCard]);
    return rows[0] || null;
  },

  /** 搜索顾客 (按姓名/手机号/身份证号模糊匹配) */
  async search(keyword, conn) {
    const db = conn || pool;
    const [rows] = await db.query(
      `SELECT c.id, c.real_name, c.gender, c.id_card, c.phone, c.address,
              u.username, u.created_at
       FROM \`customer\` c JOIN \`user\` u ON c.user_id = u.id
       WHERE c.real_name LIKE ? OR c.phone LIKE ? OR c.id_card LIKE ?
       ORDER BY c.id DESC LIMIT 20`,
      [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`]
    );
    return rows;
  },

  /** 按 ID 查顾客信息 */
  async findById(customerId, conn) {
    const db = conn || pool;
    const [rows] = await db.query('SELECT * FROM `customer` WHERE id = ?', [customerId]);
    return rows[0] || null;
  },

  /** 创建顾客信息 */
  async create({ userId, realName, gender, idCard, phone, address }, conn) {
    const db = conn || pool;
    const [result] = await db.query(
      'INSERT INTO `customer` (user_id, real_name, gender, id_card, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, realName, gender, idCard, phone, address]
    );
    return result.insertId;
  },

  /** 更新手机号 */
  async updatePhone(userId, phone, conn) {
    const db = conn || pool;
    await db.query('UPDATE `customer` SET phone = ? WHERE user_id = ?', [phone, userId]);
  },

  /** 更新收货地址 */
  async updateAddress(userId, address, conn) {
    const db = conn || pool;
    await db.query('UPDATE `customer` SET address = ? WHERE user_id = ?', [address, userId]);
  },
};

module.exports = { userDao, customerDao };
