const logDao = require('../dao/log.dao');

const logService = {
  /**
   * 写入系统日志
   */
  async writeLog({ action, operatorId, targetType, targetId, detail }, conn) {
    await logDao.insert({ action, operatorId, targetType, targetId, detail }, conn);
  },

  /**
   * 查询系统日志 (管理员)
   */
  async queryLogs({ page, pageSize, action, operatorId, targetType, startDate, endDate }) {
    return logDao.findByPage({ page, pageSize, action, operatorId, targetType, startDate, endDate });
  },
};

module.exports = logService;
