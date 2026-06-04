const pool = require('../config/db');
const productDao = require('../dao/product.dao');

const PRODUCT_CATEGORIES = [
  '笔记本电脑', '台式电脑', '平板', '智能手机', '蓝牙耳机',
  '摄像头', '投影仪', '电视', '键盘', '鼠标',
];

const productService = {
  /** 商品列表 (前台) */
  async list({ page, pageSize, keyword, category, brand, sort }) {
    return productDao.findList({ page, pageSize, keyword, category, brand, sort });
  },

  /** 商品详情 */
  async detail(productId) {
    const product = await productDao.findById(productId);
    if (!product) {
      throw Object.assign(new Error('商品不存在'), { statusCode: 404 });
    }
    const specs = await productDao.findSpecs(productId);
    return { ...product, specs };
  },

  /** 管理员: 添加商品 */
  async create({ name, category, brand, price, imageUrl, specs }) {
    if (!name || !category || price == null) {
      throw Object.assign(new Error('缺少必填参数'), { statusCode: 400 });
    }
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const productId = await productDao.create({ name, category, brand, price, imageUrl }, conn);
      if (specs && specs.length > 0) {
        await productDao.batchCreateSpecs(
          specs.map(s => ({ productId, specKey: s.specKey, specValue: s.specValue, specGroup: s.specGroup })),
          conn
        );
      }
      await conn.commit();
      return { productId };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /** 管理员: 编辑商品 */
  async update(productId, { name, category, brand, price, imageUrl, specs }) {
    const product = await productDao.findById(productId);
    if (!product) {
      throw Object.assign(new Error('商品不存在'), { statusCode: 404 });
    }
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await productDao.update(productId, { name, category, brand, price, imageUrl }, conn);
      await productDao.deleteSpecs(productId, conn);
      if (specs && specs.length > 0) {
        await productDao.batchCreateSpecs(
          specs.map(s => ({ productId, specKey: s.specKey, specValue: s.specValue, specGroup: s.specGroup })),
          conn
        );
      }
      await conn.commit();
      return { productId };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /** 管理员: 上架/下架 */
  async updateStatus(productId, status) {
    if (!['on', 'off'].includes(status)) {
      throw Object.assign(new Error('状态值无效'), { statusCode: 400 });
    }
    const product = await productDao.findById(productId);
    if (!product) {
      throw Object.assign(new Error('商品不存在'), { statusCode: 404 });
    }
    await productDao.updateStatus(productId, status);
    return { productId, status };
  },

  /** 管理员: 删除商品 */
  async delete(productId) {
    const product = await productDao.findById(productId);
    if (!product) {
      throw Object.assign(new Error('商品不存在'), { statusCode: 404 });
    }
    const unfinished = await productDao.countUnfinishedOrders(productId);
    if (unfinished > 0) {
      throw Object.assign(new Error('该商品尚有未完成订单，无法删除'), { statusCode: 400 });
    }
    await productDao.delete(productId);
    return { productId };
  },

  /** 管理员: 商品列表 (含下架) */
  async listAdmin({ page, pageSize, keyword, category, brand }) {
    return productDao.findListAdmin({ page, pageSize, keyword, category, brand });
  },

  /** 获取分类列表 */
  getCategories() {
    return PRODUCT_CATEGORIES;
  },

  /** 获取品牌列表 */
  async getBrands() {
    return productDao.getBrands();
  },
};

module.exports = productService;
