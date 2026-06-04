const { error } = require('../utils/response');

/**
 * 全局错误处理中间件
 * 统一捕获异常，返回标准错误响应，不泄露敏感信息
 */
function errorHandler(err, req, res, _next) {
  console.error(`[${new Date().toISOString()}] Error:`, err.message);
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? '服务器内部错误' : err.message;

  res.status(statusCode).json(error(statusCode, message));
}

module.exports = errorHandler;
