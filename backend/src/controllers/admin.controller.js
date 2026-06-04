const adminService = require('../services/admin.service');
const logService = require('../services/log.service');
const inventoryService = require('../services/inventory.service');
const { success } = require('../utils/response');

const adminController = {
  async dashboard(req, res, next) {
    try {
      const result = await adminService.dashboard();
      res.json(success(result));
    } catch (err) { next(err); }
  },

  async listSales(req, res, next) {
    try {
      const { page, pageSize } = req.query;
      const result = await adminService.listSales({ page: parseInt(page) || 1, pageSize: parseInt(pageSize) || 10 });
      res.json(success(result));
    } catch (err) { next(err); }
  },

  async createSales(req, res, next) {
    try {
      const { username, password, realName } = req.body;
      if (!username || !password || !realName) {
        return res.status(400).json({ code: 400, message: '缺少必填参数' });
      }
      const result = await adminService.createSales({ username, password, realName });
      res.json(success(result, '销售人员添加成功'));
    } catch (err) { next(err); }
  },

  async deleteSales(req, res, next) {
    try {
      const result = await adminService.deleteSales(parseInt(req.params.id));
      res.json(success(result, '销售人员已删除'));
    } catch (err) { next(err); }
  },

  async resetPassword(req, res, next) {
    try {
      const result = await adminService.resetPassword(parseInt(req.params.id));
      res.json(success(result, '密码已重置'));
    } catch (err) { next(err); }
  },

  async listOrders(req, res, next) {
    try {
      const { page, pageSize, status, keyword, startDate, endDate, channel } = req.query;
      const result = await adminService.listOrders({
        page: parseInt(page) || 1, pageSize: parseInt(pageSize) || 10,
        status, keyword, startDate, endDate, channel,
      });
      res.json(success(result));
    } catch (err) { next(err); }
  },

  async listInventoryLogs(req, res, next) {
    try {
      const { page, pageSize, type, operatorId, productId, startDate, endDate } = req.query;
      const result = await adminService.listInventoryLogs({
        page: parseInt(page) || 1, pageSize: parseInt(pageSize) || 10,
        type, operatorId, productId, startDate, endDate,
      });
      res.json(success(result));
    } catch (err) { next(err); }
  },

  async querySystemLogs(req, res, next) {
    try {
      const { page, pageSize, action, operatorId, targetType, startDate, endDate } = req.query;
      const result = await logService.queryLogs({
        page: parseInt(page) || 1, pageSize: parseInt(pageSize) || 20,
        action, operatorId: operatorId ? parseInt(operatorId) : undefined,
        targetType, startDate, endDate,
      });
      res.json(success(result));
    } catch (err) { next(err); }
  },

  async listOperators(req, res, next) {
    try {
      const result = await adminService.listOperators();
      res.json(success(result));
    } catch (err) { next(err); }
  },
};

module.exports = adminController;
