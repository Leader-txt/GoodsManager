const pool = require('../config/db');

const cartDao = {
  /** 获取用户购物车列表 (JOIN product + inventory) */
  async findByUserId(userId, conn) {
    const db = conn || pool;
    const [rows] = await db.query(
      `SELECT c.id, c.quantity, c.product_id as productId,
              p.name as productName, p.price, p.image_url as productImage,
              COALESCE(i.quantity, 0) as stockQuantity
       FROM cart c
       JOIN product p ON c.product_id = p.id
       LEFT JOIN inventory i ON p.id = i.product_id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [userId]
    );
    return rows;
  },

  /** 加入购物车 (INSERT ... ON DUPLICATE KEY UPDATE) */
  async addOrUpdate(userId, productId, quantity, conn) {
    const db = conn || pool;
    await db.query(
      `INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
      [userId, productId, quantity, quantity]
    );
  },

  /** 更新购物车数量 */
  async updateQuantity(cartId, userId, quantity, conn) {
    const db = conn || pool;
    const [result] = await db.query(
      'UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?',
      [quantity, cartId, userId]
    );
    return result.affectedRows;
  },

  /** 删除购物车项 */
  async deleteById(cartId, userId, conn) {
    const db = conn || pool;
    await db.query('DELETE FROM cart WHERE id = ? AND user_id = ?', [cartId, userId]);
  },

  /** 按用户ID找购物车项 */
  async findById(cartId, userId, conn) {
    const db = conn || pool;
    const [rows] = await db.query(
      'SELECT * FROM cart WHERE id = ? AND user_id = ?', [cartId, userId]
    );
    return rows[0] || null;
  },

  /** 批量删除购物车项 */
  async deleteByIds(ids, userId, conn) {
    const db = conn || pool;
    if (!ids || ids.length === 0) return;
    await db.query(
      `DELETE FROM cart WHERE id IN (?) AND user_id = ?`,
      [ids, userId]
    );
  },
};

module.exports = cartDao;
