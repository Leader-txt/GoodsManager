const orderService = require('../services/order.service');
const { success, error } = require('../utils/response');

const orderController = {
  /** POST /api/orders — 提交订单 */
  async create(req, res, next) {
    try {
      const result = await orderService.create(req.user.userId, req.body);
      res.json(success(result, '订单创建成功'));
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/orders — 我的订单列表 */
  async list(req, res, next) {
    try {
      const { page, pageSize, status } = req.query;
      const result = await orderService.listByCustomer(req.user.userId, {
        page: parseInt(page, 10) || 1,
        pageSize: parseInt(pageSize, 10) || 10,
        status,
      });
      res.json(success(result));
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/orders/:id — 订单详情 */
  async detail(req, res, next) {
    try {
      const result = await orderService.detail(parseInt(req.params.id, 10));
      res.json(success(result));
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/orders/by-no/:orderNo — 按订单号查订单详情 */
  async detailByOrderNo(req, res, next) {
    try {
      const result = await orderService.detailByOrderNo(req.params.orderNo);
      res.json(success(result));
    } catch (err) {
      next(err);
    }
  },

  /** PUT /api/orders/:id/pay — 支付确认 */
  async pay(req, res, next) {
    try {
      const result = await orderService.pay(parseInt(req.params.id, 10), req.user.userId);
      res.json(success(result, '支付成功'));
    } catch (err) {
      next(err);
    }
  },

  /** PUT /api/orders/:id/cancel — 取消订单 */
  async cancel(req, res, next) {
    try {
      const result = await orderService.cancel(parseInt(req.params.id, 10), req.user.userId);
      res.json(success(result, '订单已取消'));
    } catch (err) {
      next(err);
    }
  },

  /** PUT /api/orders/:id/sign — 确认签收 */
  async sign(req, res, next) {
    try {
      const result = await orderService.sign(parseInt(req.params.id, 10));
      res.json(success(result, '已确认签收'));
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/orders/sales — 销售人员订单列表 */
  async listSalesOrders(req, res, next) {
    try {
      const { page, pageSize, status } = req.query;
      const result = await orderService.listBySales(req.user.userId, {
        page: parseInt(page, 10) || 1,
        pageSize: parseInt(pageSize, 10) || 10,
        status,
      });
      res.json(success(result));
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/orders/offline — 线下订单 */
  async createOffline(req, res, next) {
    try {
      const result = await orderService.createOffline(req.user.userId, req.body);
      res.json(success(result, '线下订单创建成功'));
    } catch (err) {
      next(err);
    }
  },
};

module.exports = orderController;
