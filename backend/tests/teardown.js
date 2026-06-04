/**
 * Jest 全局 teardown
 * 关闭 MySQL 连接池，释放数据库连接资源
 */
const pool = require('../src/config/db');

module.exports = async () => {
  try {
    await pool.end();
  } catch {
    // 连接池可能已被关闭
  }
};
