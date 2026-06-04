const cartDao = require('../dao/cart.dao');
const productDao = require('../dao/product.dao');

const cartService = {
  /** 获取购物车列表 */
  async list(userId) {
    return cartDao.findByUserId(userId);
  },

  /** 加入购物车 */
  async add(userId, { productId, quantity }) {
    if (!productId) {
      throw Object.assign(new Error('商品ID不能为空'), { statusCode: 400 });
    }
    if (!quantity || quantity < 1) {
      throw Object.assign(new Error('数量至少为1'), { statusCode: 400 });
    }

    const product = await productDao.findById(productId);
    if (!product || product.status === 'off') {
      throw Object.assign(new Error('商品不存在或已下架'), { statusCode: 400 });
    }

    // 校验库存
    if (product.stock_quantity < quantity) {
      throw Object.assign(new Error('库存不足'), { statusCode: 400 });
    }

    await cartDao.addOrUpdate(userId, productId, quantity);
    return { productId, quantity };
  },

  /** 修改数量 */
  async updateQuantity(userId, cartId, quantity) {
    if (!quantity || quantity < 1) {
      throw Object.assign(new Error('数量至少为1'), { statusCode: 400 });
    }

    const item = await cartDao.findById(cartId, userId);
    if (!item) {
      throw Object.assign(new Error('购物车项不存在'), { statusCode: 404 });
    }

    const product = await productDao.findById(item.product_id);
    if (product.stock_quantity < quantity) {
      throw Object.assign(new Error('库存不足'), { statusCode: 400 });
    }

    await cartDao.updateQuantity(cartId, userId, quantity);
    return { cartId, quantity };
  },

  /** 删除购物车项 */
  async remove(userId, cartId) {
    const item = await cartDao.findById(cartId, userId);
    if (!item) {
      throw Object.assign(new Error('购物车项不存在'), { statusCode: 404 });
    }
    await cartDao.deleteById(cartId, userId);
    return { cartId };
  },

  /** 清空已选 (结算后) */
  async clearSelected(userId, ids) {
    if (!ids || ids.length === 0) {
      throw Object.assign(new Error('请选择要清空的商品'), { statusCode: 400 });
    }
    await cartDao.deleteByIds(ids, userId);
    return { removed: ids.length };
  },
};

module.exports = cartService;
