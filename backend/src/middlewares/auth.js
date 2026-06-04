const jwtUtil = require('../utils/jwt');
const { error } = require('../utils/response');

/**
 * JWT 认证中间件
 * 从 Authorization 头提取 Bearer Token，验证后注入 req.user
 */
function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(error(401, '请先登录'));
  }

  const token = authHeader.split(' ')[1];
  const payload = jwtUtil.verify(token);

  if (!payload) {
    return res.status(401).json(error(401, '登录已过期，请重新登录'));
  }

  req.user = {
    userId: payload.userId,
    username: payload.username,
    role: payload.role,
  };

  next();
}

module.exports = auth;
