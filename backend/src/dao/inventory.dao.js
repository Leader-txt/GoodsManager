const pool = require('../config/db');

const shelfDao = {
  async findAll({ page = 1, pageSize = 10 }, conn) {
    const db = conn || pool;
    const offset = (page - 1) * pageSize;
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM shelf');
    const [rows] = await db.query('SELECT * FROM shelf ORDER BY id LIMIT ? OFFSET ?', [pageSize, offset]);
    return { total, list: rows };
  },

  async findById(shelfId, conn) {
    const db = conn || pool;
    const [rows] = await db.query('SELECT * FROM shelf WHERE id = ?', [shelfId]);
    return rows[0] || null;
  },

  async findByCode(shelfCode, conn) {
    const db = conn || pool;
    const [rows] = await db.query('SELECT * FROM shelf WHERE shelf_code = ?', [shelfCode]);
    return rows[0] || null;
  },

  async create({ shelfCode, description }, conn) {
    const db = conn || pool;
    const [result] = await db.query(
      'INSERT INTO shelf (shelf_code, description) VALUES (?, ?)',
      [shelfCode, description]
    );
    return result.insertId;
  },

  async update(shelfId, { shelfCode, description }, conn) {
    const db = conn || pool;
    await db.query(
      'UPDATE shelf SET shelf_code=?, description=? WHERE id=?',
      [shelfCode, description, shelfId]
    );
  },

  async delete(shelfId, conn) {
    const db = conn || pool;
    await db.query('DELETE FROM shelf WHERE id=?', [shelfId]);
  },

  async countInventory(shelfId, conn) {
    const db = conn || pool;
    const [[{ cnt }]] = await db.query(
      'SELECT COUNT(*) as cnt FROM inventory WHERE shelf_id=? AND quantity > 0', [shelfId]
    );
    return cnt;
  },
};

const inventoryDao = {
  async findAll({ page = 1, pageSize = 10, keyword, category, stockStatus }, conn) {
    const db = conn || pool;
    const offset = (page - 1) * pageSize;
    let conditions = [];
    let params = [];

    if (keyword) {
      conditions.push('p.name LIKE ?');
      params.push(`%${keyword}%`);
    }
    if (category) {
      conditions.push('p.category = ?');
      params.push(category);
    }
    if (stockStatus === 'in_stock') {
      conditions.push('i.quantity > 0');
    } else if (stockStatus === 'out_of_stock') {
      conditions.push('i.quantity = 0');
    } else if (stockStatus === 'low_stock') {
      conditions.push('i.quantity > 0 AND i.quantity < 5');
    }

    const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM inventory i JOIN product p ON i.product_id = p.id LEFT JOIN shelf s ON i.shelf_id = s.id ${whereClause}`, params
    );
    const [rows] = await db.query(
      `SELECT i.*, p.name as product_name, p.category, p.brand, s.shelf_code
       FROM inventory i JOIN product p ON i.product_id = p.id
       LEFT JOIN shelf s ON i.shelf_id = s.id
       ${whereClause} ORDER BY i.updated_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );
    return { total, list: rows };
  },

  async findByProductId(productId, conn) {
    const db = conn || pool;
    const [rows] = await db.query(
      `SELECT i.*, p.name as product_name, p.category, s.shelf_code
       FROM inventory i JOIN product p ON i.product_id = p.id
       LEFT JOIN shelf s ON i.shelf_id = s.id
       WHERE i.product_id = ?`, [productId]
    );
    return rows[0] || null;
  },

  async upsert(productId, shelfId, quantity, conn) {
    const db = conn || pool;
    await db.query(
      `INSERT INTO inventory (product_id, shelf_id, quantity) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + ?, shelf_id = COALESCE(?, shelf_id)`,
      [productId, shelfId, quantity, quantity, shelfId]
    );
  },

  async deduct(productId, quantity, conn) {
    const db = conn || pool;
    const [result] = await db.query(
      'UPDATE inventory SET quantity = quantity - ? WHERE product_id = ? AND quantity >= ?',
      [quantity, productId, quantity]
    );
    return result.affectedRows;
  },

  async restore(productId, quantity, conn) {
    const db = conn || pool;
    await db.query('UPDATE inventory SET quantity = quantity + ? WHERE product_id = ?', [quantity, productId]);
  },
};

const inventoryLogDao = {
  async create({ type, productId, productName, productModel, quantity, operatorId, orderId, remark }, conn) {
    const db = conn || pool;
    await db.query(
      'INSERT INTO inventory_log (type, product_id, product_name, product_model, quantity, operator_id, order_id, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [type, productId, productName, productModel || '', quantity, operatorId || null, orderId || null, remark || '']
    );
  },

  async findByProductId(productId, conn) {
    const db = conn || pool;
    const [rows] = await db.query(
      `SELECT il.*, u.username as operator_name
       FROM inventory_log il LEFT JOIN user u ON il.operator_id = u.id
       WHERE il.product_id = ? ORDER BY il.created_at DESC`, [productId]
    );
    return rows;
  },

  async findAll({ page = 1, pageSize = 10, type, operatorId, productId, startDate, endDate }, conn) {
    const db = conn || pool;
    const offset = (page - 1) * pageSize;
    let conditions = [];
    let params = [];

    if (type) { conditions.push('il.type = ?'); params.push(type); }
    if (operatorId) { conditions.push('il.operator_id = ?'); params.push(operatorId); }
    if (productId) { conditions.push('il.product_id = ?'); params.push(productId); }
    if (startDate) { conditions.push('il.created_at >= ?'); params.push(startDate); }
    if (endDate) { conditions.push('il.created_at <= ?'); params.push(endDate + ' 23:59:59'); }

    const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM inventory_log il ${whereClause}`, params
    );
    const [rows] = await db.query(
      `SELECT il.*, u.username as operator_name, o.order_no
       FROM inventory_log il LEFT JOIN user u ON il.operator_id = u.id
       LEFT JOIN \`order\` o ON il.order_id = o.id
       ${whereClause} ORDER BY il.created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );
    return { total, list: rows };
  },

  async getOperators(conn) {
    const db = conn || pool;
    const [rows] = await db.query(
      `SELECT DISTINCT u.id, u.username
       FROM inventory_log il JOIN user u ON il.operator_id = u.id
       ORDER BY u.username`
    );
    return rows;
  },

  async findRecent(limit = 5, conn) {
    const db = conn || pool;
    const [rows] = await db.query(
      `SELECT il.*, u.username as operator_name
       FROM inventory_log il LEFT JOIN user u ON il.operator_id = u.id
       ORDER BY il.created_at DESC LIMIT ?`, [limit]
    );
    return rows;
  },
};

module.exports = { shelfDao, inventoryDao, inventoryLogDao };
