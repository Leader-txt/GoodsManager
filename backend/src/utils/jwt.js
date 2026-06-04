const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * 签发 JWT Token
 * @param {Object} payload - { userId, username, role }
 * @returns {string} JWT token
 */
function sign(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expire });
}

/**
 * 验证 JWT Token
 * @param {string} token
 * @returns {Object|null} 解码后的 payload，失败返回 null
 */
function verify(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (err) {
    return null;
  }
}

module.exports = { sign, verify };
