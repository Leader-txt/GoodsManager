const pool = require('../config/db');

const productDao = {
  /** 商品列表查询 (分页+筛选+排序+关联库存) */
  async findList({ page = 1, pageSize = 12, keyword, category, brand, sort }, conn) {
    const db = conn || pool;
    const offset = (page - 1) * pageSize;
    let conditions = ['p.status = ?'];
    let params = ['on'];

    if (keyword) {
      conditions.push('p.name LIKE ?');
      params.push(`%${keyword}%`);
    }
    if (category) {
      conditions.push('p.category = ?');
      params.push(category);
    }
    if (brand) {
      conditions.push('p.brand = ?');
      params.push(brand);
    }

    const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    let orderClause = 'ORDER BY p.created_at DESC';
    if (sort === 'price_asc') orderClause = 'ORDER BY p.price ASC';
    else if (sort === 'price_desc') orderClause = 'ORDER BY p.price DESC';

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM product p ${whereClause}`, params
    );

    const [rows] = await db.query(
      `SELECT p.*, COALESCE(i.quantity, 0) as stock_quantity
       FROM product p
       LEFT JOIN inventory i ON p.id = i.product_id
       ${whereClause} ${orderClause} LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );
    
    return { total, list: rows };
  },

  /** 按ID查商品 */
  async findById(productId, conn) {
    const db = conn || pool;
    const [rows] = await db.query(
      `SELECT p.*, COALESCE(i.quantity, 0) as stock_quantity, i.shelf_id
       FROM product p
       LEFT JOIN inventory i ON p.id = i.product_id
       WHERE p.id = ?`, [productId]
    );
    return rows[0] || null;
  },

  /** 查商品规格 */
  async findSpecs(productId, conn) {
    const db = conn || pool;
    const [rows] = await db.query(
      'SELECT spec_key, spec_value, spec_group FROM product_spec WHERE product_id = ? ORDER BY spec_group, id',
      [productId]
    );
    return rows;
  },

  /** 创建商品 */
  async create({ name, category, brand, price, imageUrl, status }, conn) {
    const db = conn || pool;
    const [result] = await db.query(
      'INSERT INTO product (name, category, brand, price, image_url, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, category, brand, price, imageUrl, status || 'on']
    );
    return result.insertId;
  },

  /** 批量添加规格 */
  async batchCreateSpecs(specs, conn) {
    const db = conn || pool;
    if (!specs || specs.length === 0) return;
    const values = specs.map(s => [s.productId, s.specKey, s.specValue, s.specGroup]);
    await db.query(
      'INSERT INTO product_spec (product_id, spec_key, spec_value, spec_group) VALUES ?',
      [values]
    );
  },

  /** 更新商品 */
  async update(productId, { name, category, brand, price, imageUrl }, conn) {
    const db = conn || pool;
    await db.query(
      'UPDATE product SET name=?, category=?, brand=?, price=?, image_url=? WHERE id=?',
      [name, category, brand, price, imageUrl, productId]
    );
  },

  /** 更新商品状态 */
  async updateStatus(productId, status, conn) {
    const db = conn || pool;
    await db.query('UPDATE product SET status=? WHERE id=?', [status, productId]);
  },

  /** 删除商品规格 */
  async deleteSpecs(productId, conn) {
    const db = conn || pool;
    await db.query('DELETE FROM product_spec WHERE product_id=?', [productId]);
  },

  /** 删除商品 */
  async delete(productId, conn) {
    const db = conn || pool;
    await db.query('DELETE FROM product WHERE id=?', [productId]);
  },

  /** 查商品未完成订单数 */
  async countUnfinishedOrders(productId, conn) {
    const db = conn || pool;
    const [[{ cnt }]] = await db.query(
      `SELECT COUNT(*) as cnt FROM order_item oi
       JOIN \`order\` o ON oi.order_id = o.id
       WHERE oi.product_id = ? AND o.status NOT IN ('signed', 'cancelled')`,
      [productId]
    );
    return cnt;
  },

  /** 获取所有商品类型 */
  async getCategories(conn) {
    const db = conn || pool;
    const [rows] = await db.query('SELECT DISTINCT category FROM product WHERE status=\'on\'');
    return rows.map(r => r.category);
  },

  /** 获取所有品牌 */
  async getBrands(conn) {
    const db = conn || pool;
    const [rows] = await db.query('SELECT DISTINCT brand FROM product WHERE status=\'on\' AND brand IS NOT NULL');
    return rows.map(r => r.brand);
  },

  /** 管理员查商品列表 (含下架) */
  async findListAdmin({ page = 1, pageSize = 12, keyword, category, brand }, conn) {
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
    if (brand) {
      conditions.push('p.brand = ?');
      params.push(brand);
    }

    const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM product p ${whereClause}`, params);
    const [rows] = await db.query(
      `SELECT p.*, COALESCE(i.quantity, 0) as stock_quantity
       FROM product p LEFT JOIN inventory i ON p.id = i.product_id
       ${whereClause} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    return { total, list: rows };
  },
};

module.exports = productDao;
