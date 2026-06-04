const pool = require('../config/db');
const { shelfDao, inventoryDao, inventoryLogDao } = require('../dao/inventory.dao');
const productDao = require('../dao/product.dao');
const orderDao = require('../dao/order.dao');

const SHELF_CODE_REGEX = /^\d{1,2}-\d{1,2}-\d{1,2}$/;

/** 自动生成快递信息 */
function generateExpressInfo() {
  const companies = ['顺丰速运', '圆通速递', '中通快递', '韵达速递', '申通快递', '京东物流'];
  const company = companies[Math.floor(Math.random() * companies.length)];
  const prefix = { '顺丰速运': 'SF', '圆通速递': 'YT', '中通快递': 'ZT', '韵达速递': 'YD', '申通快递': 'ST', '京东物流': 'JD' }[company];
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 10).toUpperCase();
  return { expressCompany: company, expressNo: `${prefix}${ts}${rand}` };
}

const inventoryService = {
  // ===== 货架管理 =====

  async listShelves({ page, pageSize }) {
    return shelfDao.findAll({ page, pageSize });
  },

  async createShelf({ shelfCode, description }) {
    if (!SHELF_CODE_REGEX.test(shelfCode)) {
      throw Object.assign(new Error('货架编号格式错误，需为 A-B-C 格式'), { statusCode: 400 });
    }
    const existing = await shelfDao.findByCode(shelfCode);
    if (existing) {
      throw Object.assign(new Error('货架编号已存在'), { statusCode: 400 });
    }
    const shelfId = await shelfDao.create({ shelfCode, description });
    return { shelfId, shelfCode };
  },

  async updateShelf(shelfId, { shelfCode, description }) {
    const shelf = await shelfDao.findById(shelfId);
    if (!shelf) throw Object.assign(new Error('货架不存在'), { statusCode: 404 });
    if (!SHELF_CODE_REGEX.test(shelfCode)) {
      throw Object.assign(new Error('货架编号格式错误'), { statusCode: 400 });
    }
    const existing = await shelfDao.findByCode(shelfCode);
    if (existing && existing.id !== shelfId) {
      throw Object.assign(new Error('货架编号已存在'), { statusCode: 400 });
    }
    await shelfDao.update(shelfId, { shelfCode, description });
    return { shelfId, shelfCode };
  },

  async deleteShelf(shelfId) {
    const shelf = await shelfDao.findById(shelfId);
    if (!shelf) throw Object.assign(new Error('货架不存在'), { statusCode: 404 });
    const count = await shelfDao.countInventory(shelfId);
    if (count > 0) {
      throw Object.assign(new Error('该货架尚有商品，请先转移库存'), { statusCode: 400 });
    }
    await shelfDao.delete(shelfId);
    return { shelfId };
  },

  // ===== 库存管理 =====

  async listInventory({ page, pageSize, keyword, category, stockStatus }) {
    return inventoryDao.findAll({ page, pageSize, keyword, category, stockStatus });
  },

  async getInventoryDetail(productId) {
    const inv = await inventoryDao.findByProductId(productId);
    if (!inv) throw Object.assign(new Error('库存记录不存在'), { statusCode: 404 });
    const logs = await inventoryLogDao.findByProductId(productId);
    return { ...inv, logs };
  },

  // ===== 入库 =====

  async stockIn({ productId, shelfId, quantity, remark }, operatorId) {
    if (!quantity || quantity <= 0) {
      throw Object.assign(new Error('入库数量必须大于0'), { statusCode: 400 });
    }
    const product = await productDao.findById(productId);
    if (!product) throw Object.assign(new Error('商品不存在'), { statusCode: 404 });
    const shelf = await shelfDao.findById(shelfId);
    if (!shelf) throw Object.assign(new Error('货架不存在'), { statusCode: 404 });

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 查入库前库存
      const before = await inventoryDao.findByProductId(productId, conn);
      const beforeQty = before ? before.quantity : 0;

      await inventoryDao.upsert(productId, shelfId, quantity, conn);
      await inventoryLogDao.create({
        type: 'in', productId, productName: product.name,
        quantity, operatorId, remark: remark || '入库',
      }, conn);

      await conn.commit();
      return { productId, productName: product.name, quantity, beforeQuantity: beforeQty, afterQuantity: beforeQty + quantity };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // ===== 出库 =====

  async stockOut({ productId, quantity, orderId, remark }, operatorId) {
    if (!quantity || quantity <= 0) {
      throw Object.assign(new Error('出库数量必须大于0'), { statusCode: 400 });
    }
    const product = await productDao.findById(productId);
    if (!product) throw Object.assign(new Error('商品不存在'), { statusCode: 404 });

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const before = await inventoryDao.findByProductId(productId, conn);
      if (!before || before.quantity < quantity) {
        throw Object.assign(new Error('库存不足'), { statusCode: 400 });
      }

      const affected = await inventoryDao.deduct(productId, quantity, conn);
      if (affected === 0) {
        throw Object.assign(new Error('库存不足'), { statusCode: 400 });
      }

      await inventoryLogDao.create({
        type: 'out', productId, productName: product.name,
        quantity, operatorId, orderId, remark: remark || '出库',
      }, conn);

      // 关联订单则更新状态为 delivering（出库即配送）
      if (orderId) {
        const order = await orderDao.findById(orderId, conn);
        const canStockOut = order && (
          order.status === 'paid' ||
          (order.status === 'pending' && order.pay_method === 'cod')
        );
        if (canStockOut) {
          const extra = {};
          if (order.delivery_type === 'delivery' && !order.express_company) {
            const express = generateExpressInfo();
            extra.express_company = express.expressCompany;
            extra.express_no = express.expressNo;
          }
          await orderDao.updateStatus(orderId, 'delivering', extra, conn);
        }
      }

      await conn.commit();
      return { productId, productName: product.name, quantity, beforeQuantity: before.quantity, afterQuantity: before.quantity - quantity };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // ===== 批量出库（按订单） =====

  async stockOutBatch(orderNo, operatorId) {
    const order = await orderDao.findByOrderNo(orderNo);
    if (!order) throw Object.assign(new Error('订单不存在'), { statusCode: 404 });

    const canStockOut = order.status === 'paid' ||
      (order.status === 'pending' && order.pay_method === 'cod');
    if (!canStockOut) {
      throw Object.assign(new Error('仅已支付或货到付款订单可出库'), { statusCode: 400 });
    }

    const items = await orderDao.findItems(order.id);
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const item of items) {
        const affected = await inventoryDao.deduct(item.product_id, item.quantity, conn);
        if (affected === 0) {
          throw Object.assign(new Error(`商品 "${item.product_name}" 库存不足`), { statusCode: 400 });
        }
        await inventoryLogDao.create({
          type: 'out', productId: item.product_id, productName: item.product_name,
          quantity: item.quantity, operatorId, orderId: order.id, remark: `订单 #${order.order_no} 出库`,
        }, conn);
      }
      const extra = {};
      if (order.delivery_type === 'delivery' && !order.express_company) {
        const express = generateExpressInfo();
        extra.express_company = express.expressCompany;
        extra.express_no = express.expressNo;
      }
      await orderDao.updateStatus(order.id, 'delivering', extra, conn);
      await conn.commit();
      return { orderId: order.id, orderNo: order.order_no, status: 'delivering' };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // ===== 出入库日志查询 =====

  async listInventoryLogs(params) {
    return inventoryLogDao.findAll(params);
  },

  async recentLogs(limit) {
    return inventoryLogDao.findRecent(limit);
  },
};

module.exports = inventoryService;
