const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// POST /api/auth/register — 顾客注册
router.post('/register', authController.register);

// POST /api/auth/login — 用户登录
router.post('/login', authController.login);

module.exports = router;
