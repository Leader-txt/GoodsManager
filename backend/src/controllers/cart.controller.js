const cartService = require('../services/cart.service');
const { success, error } = require('../utils/response');

const cartController = {
  /** GET /api/cart */
  async list(req, res, next) {
    try {
      const items = await cartService.list(req.user.userId);
      res.json(success({ items }));
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/cart */
  async add(req, res, next) {
    try {
      const result = await cartService.add(req.user.userId, req.body);
      res.json(success(result, '已加入购物车'));
    } catch (err) {
      next(err);
    }
  },

  /** PUT /api/cart/:id */
  async updateQuantity(req, res, next) {
    try {
      const result = await cartService.updateQuantity(
        req.user.userId,
        parseInt(req.params.id, 10),
        req.body.quantity
      );
      res.json(success(result, '数量已更新'));
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /api/cart/:id */
  async remove(req, res, next) {
    try {
      const result = await cartService.remove(req.user.userId, parseInt(req.params.id, 10));
      res.json(success(result, '已删除'));
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /api/cart */
  async clearSelected(req, res, next) {
    try {
      const result = await cartService.clearSelected(req.user.userId, req.body.ids);
      res.json(success(result, '已清空'));
    } catch (err) {
      next(err);
    }
  },
};

module.exports = cartController;
