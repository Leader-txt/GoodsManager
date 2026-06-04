const logService = require('../services/log.service');
const { success } = require('../utils/response');

const logController = {
  /** GET /api/admin/system-logs */
  async queryLogs(req, res, next) {
    try {
      const { page, pageSize, action, operatorId, targetType, startDate, endDate } = req.query;
      const result = await logService.queryLogs({
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 20,
        action, operatorId: operatorId ? parseInt(operatorId) : undefined,
        targetType, startDate, endDate,
      });
      res.json(success(result));
    } catch (err) { next(err); }
  },
};

module.exports = logController;
