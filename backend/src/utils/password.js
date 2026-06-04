const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/**
 * 加密密码
 * @param {string} plain - 明文密码
 * @returns {Promise<string>} bcrypt hash
 */
async function hash(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * 比对密码
 * @param {string} plain - 明文密码
 * @param {string} hashed - 加密后的密码
 * @returns {Promise<boolean>}
 */
async function compare(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

module.exports = { hash, compare };
