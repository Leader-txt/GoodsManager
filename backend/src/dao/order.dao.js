const pool = require('../config/db');

const orderDao = {
  /** 生成订单号 YYYYMMDD + 6位自增 */
  async generateOrderNo(conn) {
    const db = conn || pool;
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const [rows] = await db.query(
      "SELECT order_no FROM `order` WHERE order_no LIKE ? ORDER BY order_no DESC LIMIT 1",
      [`${today}%`]
    );
    if (rows.length === 0) {
      return `${today}000001`;
    }
    const lastNo = rows[0].order_no;
    const seq = parseInt(lastNo.slice(-6), 10) + 1;
    return `${today}${String(seq).padStart(6, '0')}`;
  },

  /** 创建订单 */
  async create({ orderNo, customerId, salesId, totalAmount, payMethod, deliveryType, address, expressCompany, expressNo, status }, conn) {
    const db = conn || pool;
    const [result] = await db.query(
      `INSERT INTO \`order\` (order_no, customer_id, sales_id, total_amount, pay_method, delivery_type, address, express_company, express_no, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderNo, customerId, salesId || null, totalAmount, payMethod, deliveryType, address || null, expressCompany || null, expressNo || null, status || 'pending']
    );
    return result.insertId;
  },

  /** 批量创建订单项 */
  async batchCreateItems(items, conn) {
    const db = conn || pool;
    if (!items || items.length === 0) return;
    const values = items.map(i => [i.orderId, i.productId, i.quantity, i.price]);
    await db.query(
      'INSERT INTO order_item (order_id, product_id, quantity, price) VALUES ?',
      [values]
    );
  },

  /** 按ID查订单 */
  async findById(orderId, conn) {
    const db = conn || pool;
    const [rows] = await db.query(
      `SELECT o.*, c.real_name as customer_name, c.phone as customer_phone,
              u.username as sales_name
       FROM \`order\` o
       JOIN customer c ON o.customer_id = c.id
       LEFT JOIN user u ON o.sales_id = u.id
       WHERE o.id = ?`, [orderId]
    );
    return rows[0] || null;
  },

  /** 按订单号查订单 */
  async findByOrderNo(orderNo, conn) {
    const db = conn || pool;
    const [rows] = await db.query(
      `SELECT o.*, c.real_name as customer_name, c.phone as customer_phone,
              u.username as sales_name
       FROM \`order\` o
       JOIN customer c ON o.customer_id = c.id
       LEFT JOIN user u ON o.sales_id = u.id
       WHERE o.order_no = ?`, [orderNo]
    );
    return rows[0] || null;
  },

  /** 查订单明细 */
  async findItems(orderId, conn) {
    const db = conn || pool;
    const [rows] = await db.query(
      `SELECT oi.*, p.name as product_name, p.image_url as product_image
       FROM order_item oi JOIN product p ON oi.product_id = p.id
       WHERE oi.order_id = ?`, [orderId]
    );
    return rows;
  },

  /** 更新订单状态 */
  async updateStatus(orderId, status, extra = {}, conn) {
    const db = conn || pool;
    const sets = ['status = ?'];
    const params = [status];
    Object.entries(extra).forEach(([key, val]) => {
      if (val !== undefined) { sets.push(`${key} = ?`); params.push(val); }
    });
    params.push(orderId);
    await db.query(`UPDATE \`order\` SET ${sets.join(', ')} WHERE id = ?`, params);
  },

  /** 顾客订单列表 */
  async findByCustomer(customerId, { page = 1, pageSize = 10, status }, conn) {
    const db = conn || pool;
    const offset = (page - 1) * pageSize;
    let conditions = ['o.customer_id = ?'];
    let params = [customerId];
    if (status) { conditions.push('o.status = ?'); params.push(status); }

    const whereClause = 'WHERE ' + conditions.join(' AND ');
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM \`order\` o ${whereClause}`, params
    );
    const [rows] = await db.query(
      `SELECT o.*, c.real_name as customer_name
       FROM \`order\` o JOIN customer c ON o.customer_id = c.id
       ${whereClause} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );
    return { total, list: rows };
  },

  /** 管理员：全部订单列表 */
  async findAll({ page = 1, pageSize = 10, status, keyword, startDate, endDate, channel }, conn) {
    const db = conn || pool;
    const offset = (page - 1) * pageSize;
    let conditions = [];
    let params = [];

    if (status) { conditions.push('o.status = ?'); params.push(status); }
    if (keyword) { conditions.push('(o.order_no LIKE ? OR c.real_name LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`); }
    if (startDate) { conditions.push('o.created_at >= ?'); params.push(startDate); }
    if (endDate) { conditions.push('o.created_at <= ?'); params.push(endDate + ' 23:59:59'); }
    if (channel === 'online') { conditions.push('o.sales_id IS NULL'); }
    else if (channel === 'offline') { conditions.push('o.sales_id IS NOT NULL'); }

    const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM \`order\` o JOIN customer c ON o.customer_id = c.id ${whereClause}`, params
    );
    const [rows] = await db.query(
      `SELECT o.*, c.real_name as customer_name, u.username as sales_name
       FROM \`order\` o JOIN customer c ON o.customer_id = c.id
       LEFT JOIN user u ON o.sales_id = u.id
       ${whereClause} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );
    return { total, list: rows };
  },

  /** 查超时未支付订单 */
  async findExpiredPending(hours, conn) {
    const db = conn || pool;
    const [rows] = await db.query(
      `SELECT * FROM \`order\`
       WHERE status = 'pending' AND pay_method = 'online'
       AND created_at < NOW() - INTERVAL ? HOUR`,
      [hours]
    );
    return rows;
  },

  /** 按销售人员查未完成订单数 */
  async countUnfinishedBySales(salesId, conn) {
    const db = conn || pool;
    const [[{ cnt }]] = await db.query(
      "SELECT COUNT(*) as cnt FROM `order` WHERE sales_id = ? AND status NOT IN ('signed', 'cancelled')",
      [salesId]
    );
    return cnt;
  },

  /** 按销售人员查订单列表 */
  async findBySales(salesId, { page = 1, pageSize = 10, status }, conn) {
    const db = conn || pool;
    const offset = (page - 1) * pageSize;
    let conditions = ['o.sales_id = ?'];
    let params = [salesId];
    if (status) { conditions.push('o.status = ?'); params.push(status); }

    const whereClause = 'WHERE ' + conditions.join(' AND ');
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM \`order\` o ${whereClause}`, params
    );
    const [rows] = await db.query(
      `SELECT o.*, c.real_name as customer_name
       FROM \`order\` o JOIN customer c ON o.customer_id = c.id
       ${whereClause} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );
    return { total, list: rows };
  },

  /** 仓库操作员：待处理订单列表（默认 paid/delivering/signed，paid 优先） */
  async findForWarehouse({ page = 1, pageSize = 10, status }, conn) {
    const db = conn || pool;
    const offset = (page - 1) * pageSize;
    let conditions = [];
    let params = [];

    if (status) {
      conditions.push('o.status = ?');
      params.push(status);
    } 
    else {
      conditions.push("o.status IN ('pending' ,'paid', 'delivering', 'signed')");
    }

    const whereClause = 'WHERE ' + conditions.join(' AND ');
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM \`order\` o ${whereClause}`, params
    );
    const [rows] = await db.query(
      `SELECT o.*, c.real_name as customer_name, c.phone as customer_phone
       FROM \`order\` o JOIN customer c ON o.customer_id = c.id
       ${whereClause}
       ORDER BY
         CASE o.status WHEN 'paid' THEN 0 WHEN 'delivering' THEN 1 ELSE 2 END,
         o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );
    return { total, list: rows };
  },

  /** 扣减库存 */
  async deductStock(productId, quantity, conn) {
    const db = conn || pool;
    const [result] = await db.query(
      'UPDATE inventory SET quantity = quantity - ? WHERE product_id = ? AND quantity >= ?',
      [quantity, productId, quantity]
    );
    return result.affectedRows;
  },

  /** 回退库存 */
  async restoreStock(productId, quantity, conn) {
    const db = conn || pool;
    await db.query(
      'UPDATE inventory SET quantity = quantity + ? WHERE product_id = ?',
      [quantity, productId]
    );
  },
};

module.exports = orderDao;
