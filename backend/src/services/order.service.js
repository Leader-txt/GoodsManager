const pool = require('../config/db');
const orderDao = require('../dao/order.dao');
const cartDao = require('../dao/cart.dao');
const productDao = require('../dao/product.dao');
const { customerDao } = require('../dao/user.dao');
const config = require('../config');

const orderService = {
  /**
   * 提交订单 (线上)
   */
  async create(userId, { cartItemIds, address, payMethod, deliveryType }) {
    if (!cartItemIds || cartItemIds.length === 0) {
      throw Object.assign(new Error('购物车为空'), { statusCode: 400 });
    }
    if (!['online', 'cod'].includes(payMethod)) {
      throw Object.assign(new Error('支付方式无效'), { statusCode: 400 });
    }
    if (!['self_pickup', 'delivery'].includes(deliveryType)) {
      throw Object.assign(new Error('提货方式无效'), { statusCode: 400 });
    }
    if (deliveryType === 'delivery' && !address) {
      throw Object.assign(new Error('送货上门需填写收货地址'), { statusCode: 400 });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 获取顾客信息
      const customer = await customerDao.findByUserId(userId, conn);
      if (!customer) throw Object.assign(new Error('顾客信息不存在'), { statusCode: 400 });

      // 获取购物车项
      const cartItems = await cartDao.findByUserId(userId, conn);
      const selected = cartItems.filter(c => cartItemIds.includes(c.id));
      if (selected.length === 0) {
        throw Object.assign(new Error('未找到选中的购物车项'), { statusCode: 400 });
      }

      // 逐项校验库存
      let totalAmount = 0;
      const orderItems = [];
      for (const item of selected) {
        const pid = item.productId || item.product_id;
        const product = await productDao.findById(pid, conn);
        if (!product || product.status === 'off') {
          throw Object.assign(new Error(`商品 "${item.productName}" 已下架`), { statusCode: 400 });
        }
        if (product.stock_quantity < item.quantity) {
          throw Object.assign(new Error(`商品 "${item.productName}" 库存不足`), { statusCode: 400 });
        }
        totalAmount += product.price * item.quantity;
        orderItems.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          price: product.price,
        });
      }

      // 生成订单号
      const orderNo = await orderDao.generateOrderNo(conn);

      // 创建订单（货到付款也初始为 pending，签收时再付款）
      const initialStatus = 'pending';
      const paidAt = null;
      const orderId = await orderDao.create({
        orderNo, customerId: customer.id, totalAmount,
        payMethod, deliveryType, address,
        status: initialStatus, paidAt,
      }, conn);

      // 创建订单项
      await orderDao.batchCreateItems(
        orderItems.map(i => ({ orderId, ...i })), conn
      );

      // 清理购物车
      await cartDao.deleteByIds(cartItemIds, userId, conn);

      await conn.commit();
      return { orderId, orderNo, totalAmount, status: initialStatus };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /** 支付确认 */
  async pay(orderId, userId) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const order = await orderDao.findById(orderId, conn);
      if (!order) throw Object.assign(new Error('订单不存在'), { statusCode: 404 });
      if (order.status !== 'pending') {
        throw Object.assign(new Error('订单状态不允许支付'), { statusCode: 400 });
      }

      // 扣库存
      const items = await orderDao.findItems(orderId, conn);
      for (const item of items) {
        const affected = await orderDao.deductStock(item.product_id, item.quantity, conn);
        if (affected === 0) {
          throw Object.assign(new Error(`商品 "${item.product_name}" 库存不足`), { statusCode: 400 });
        }
      }

      await orderDao.updateStatus(orderId, 'paid', { paid_at: new Date() }, conn);

      await conn.commit();
      return { orderId, orderNo: order.order_no, status: 'paid' };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /** 取消订单 */
  async cancel(orderId, userId, reason = '手动取消') {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const order = await orderDao.findById(orderId, conn);
      if (!order) throw Object.assign(new Error('订单不存在'), { statusCode: 404 });
      if (order.status !== 'pending') {
        throw Object.assign(new Error('仅待支付订单可取消'), { statusCode: 400 });
      }

      await orderDao.updateStatus(orderId, 'cancelled', { cancelled_at: new Date() }, conn);

      await conn.commit();
      return { orderId, orderNo: order.order_no, status: 'cancelled', reason };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /** 确认签收 */
  async sign(orderId) {
    const order = await orderDao.findById(orderId);
    if (!order) throw Object.assign(new Error('订单不存在'), { statusCode: 404 });
    if (order.status !== 'delivering') {
      throw Object.assign(new Error('仅配送中订单可签收'), { statusCode: 400 });
    }

    // 货到付款：签收时扣库存 + 标记付款
    if (order.pay_method === 'cod') {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const items = await orderDao.findItems(orderId, conn);
        for (const item of items) {
          const affected = await orderDao.deductStock(item.product_id, item.quantity, conn);
          if (affected === 0) {
            throw Object.assign(new Error(`商品 "${item.product_name}" 库存不足`), { statusCode: 400 });
          }
        }
        await orderDao.updateStatus(orderId, 'signed', { paid_at: new Date() }, conn);
        await conn.commit();
        return { orderId, orderNo: order.order_no, status: 'signed' };
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    }

    // 非 COD：直接签收
    await orderDao.updateStatus(orderId, 'signed');
    return { orderId, orderNo: order.order_no, status: 'signed' };
  },

  /** 我的订单列表 */
  async listByCustomer(userId, { page, pageSize, status }) {
    const customer = await customerDao.findByUserId(userId);
    if (!customer) throw Object.assign(new Error('顾客信息不存在'), { statusCode: 400 });
    return orderDao.findByCustomer(customer.id, { page, pageSize, status });
  },

  /** 销售人员的订单列表 */
  async listBySales(salesId, { page, pageSize, status }) {
    return orderDao.findBySales(salesId, { page, pageSize, status });
  },

  /** 订单详情 */
  async detail(orderId) {
    const order = await orderDao.findById(orderId);
    if (!order) throw Object.assign(new Error('订单不存在'), { statusCode: 404 });
    const items = await orderDao.findItems(orderId);
    return { ...order, items };
  },

  /** 按订单号查订单详情 */
  async detailByOrderNo(orderNo) {
    const order = await orderDao.findByOrderNo(orderNo);
    if (!order) throw Object.assign(new Error('订单不存在'), { statusCode: 404 });
    const items = await orderDao.findItems(order.id);
    return { ...order, items };
  },

  /** 线下订单创建 (sales角色) */
  async createOffline(salesId, { customerId, items, deliveryType, address, expressCompany, expressNo }) {
    if (!customerId || !items || items.length === 0) {
      throw Object.assign(new Error('缺少必填参数'), { statusCode: 400 });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const customer = await customerDao.findById(customerId, conn);
      if (!customer) throw Object.assign(new Error('顾客不存在'), { statusCode: 404 });

      // 逐项校验
      let totalAmount = 0;
      const orderItems = [];
      for (const item of items) {
        const product = await productDao.findById(item.productId, conn);
        if (!product) throw Object.assign(new Error(`商品ID ${item.productId} 不存在`), { statusCode: 400 });
        if (product.stock_quantity < item.quantity) {
          throw Object.assign(new Error(`商品 "${product.name}" 库存不足`), { statusCode: 400 });
        }
        totalAmount += product.price * item.quantity;
        orderItems.push({ productId: product.id, productName: product.name, quantity: item.quantity, price: product.price });
      }

      // 线下固定为现场结付
      const payMethod = 'offline';
      const orderNo = await orderDao.generateOrderNo(conn);

      // 自提订单进入配送中，由顾客手动签收
      const status = deliveryType === 'self_pickup' ? 'delivering' : 'paid';

      const orderId = await orderDao.create({
        orderNo, customerId, salesId, totalAmount,
        payMethod, deliveryType, address,
        expressCompany, expressNo, status,
        paidAt: new Date(),
      }, conn);

      await orderDao.batchCreateItems(
        orderItems.map(i => ({ orderId, ...i })), conn
      );

      // 现场结付直接扣库存
      for (const item of orderItems) {
        await orderDao.deductStock(item.productId || item.product_id, item.quantity, conn);
      }

      await conn.commit();
      return { orderId, orderNo, totalAmount, status };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /** 仓库操作员：待处理订单列表 */
  async listForWarehouse({ page, pageSize, status }) {
    return orderDao.findForWarehouse({ page, pageSize, status });
  },

  /** 超时取消 */
  async cancelExpiredOrders() {
    const expiredOrders = await orderDao.findExpiredPending(config.orderTimeoutHours);
    for (const order of expiredOrders) {
      try {
        const conn = await pool.getConnection();
        try {
          await conn.beginTransaction();
          await orderDao.updateStatus(order.id, 'cancelled', { cancelled_at: new Date() }, conn);
          await conn.commit();
        } catch (err) {
          await conn.rollback();
        } finally {
          conn.release();
        }
      } catch (err) {
        console.error(`取消超时订单 ${order.order_no} 失败:`, err.message);
      }
    }
    return expiredOrders.length;
  },
};

module.exports = orderService;
