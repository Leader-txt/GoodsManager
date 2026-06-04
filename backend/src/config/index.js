const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root123456',
    database: process.env.DB_NAME || 'goods_manager',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'goods_manager_jwt_secret_key_2024',
    expire: process.env.JWT_EXPIRE || '7d',
  },
  port: parseInt(process.env.PORT, 10) || 3000,
  orderTimeoutHours: parseInt(process.env.ORDER_TIMEOUT_HOURS, 10) || 24,
};
