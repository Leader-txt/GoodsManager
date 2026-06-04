const inventoryService = require('../services/inventory.service');
const { success } = require('../utils/response');

const inventoryController = {
  // ===== 货架 =====
  async listShelves(req, res, next) {
    try {
      const { page, pageSize } = req.query;
      const result = await inventoryService.listShelves({ page: parseInt(page) || 1, pageSize: parseInt(pageSize) || 10 });
      res.json(success(result));
    } catch (err) { next(err); }
  },

  async createShelf(req, res, next) {
    try {
      const result = await inventoryService.createShelf(req.body);
      res.json(success(result, '货架添加成功'));
    } catch (err) { next(err); }
  },

  async updateShelf(req, res, next) {
    try {
      const result = await inventoryService.updateShelf(parseInt(req.params.id), req.body);
      res.json(success(result, '货架编辑成功'));
    } catch (err) { next(err); }
  },

  async deleteShelf(req, res, next) {
    try {
      const result = await inventoryService.deleteShelf(parseInt(req.params.id));
      res.json(success(result, '货架已删除'));
    } catch (err) { next(err); }
  },

  // ===== 库存 =====
  async listInventory(req, res, next) {
    try {
      const { page, pageSize, keyword, category, stockStatus } = req.query;
      const result = await inventoryService.listInventory({
        page: parseInt(page) || 1, pageSize: parseInt(pageSize) || 10,
        keyword, category, stockStatus,
      });
      res.json(success(result));
    } catch (err) { next(err); }
  },

  async getInventoryDetail(req, res, next) {
    try {
      const result = await inventoryService.getInventoryDetail(parseInt(req.params.productId));
      res.json(success(result));
    } catch (err) { next(err); }
  },

  // ===== 出入库 =====
  async stockIn(req, res, next) {
    try {
      const result = await inventoryService.stockIn(req.body, req.user.userId);
      res.json(success(result, '入库成功'));
    } catch (err) { next(err); }
  },

  async stockOut(req, res, next) {
    try {
      const result = await inventoryService.stockOut(req.body, req.user.userId);
      res.json(success(result, '出库成功'));
    } catch (err) { next(err); }
  },

  async stockOutBatch(req, res, next) {
    try {
      const result = await inventoryService.stockOutBatch(req.body.orderNo, req.user.userId);
      res.json(success(result, '批量出库成功'));
    } catch (err) { next(err); }
  },
};

module.exports = inventoryController;
