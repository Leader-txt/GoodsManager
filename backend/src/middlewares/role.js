const { error } = require('../utils/response');

/**
 * 角色权限校验中间件工厂函数
 * @param {string[]} allowedRoles - 允许的角色列表
 * @returns {Function} Express 中间件
 */
function role(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(error(401, '请先登录'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(error(403, '权限不足'));
    }

    next();
  };
}

module.exports = role;
