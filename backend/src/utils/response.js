/**
 * 统一响应格式工具
 * 所有 API 返回 { code, message, data }
 */

function success(data = null, message = 'ok') {
  return {
    code: 200,
    message,
    data,
  };
}

function error(code = 500, message = '服务器内部错误') {
  return {
    code,
    message,
    data: null,
  };
}

module.exports = { success, error };
