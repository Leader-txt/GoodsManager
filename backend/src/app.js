const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// CORS 跨域
app.use(cors());

// 解析 JSON 请求体
app.use(express.json());

// 解析 URL 编码请求体
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 — 商品图片上传目录
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// 挂载所有路由
app.use('/api', routes);

// 全局错误处理（必须在路由之后）
app.use(errorHandler);

module.exports = app;
