const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');

// GET /api/users/profile — 查看个人信息 (需登录)
router.get('/profile', auth, userController.getProfile);

// PUT /api/users/phone — 修改手机号 (需登录)
router.put('/phone', auth, userController.updatePhone);

// PUT /api/users/address — 修改收货地址 (需登录)
router.put('/address', auth, userController.updateAddress);

// POST /api/users/offline-register — 线下注册 (需 sales 角色)
router.post('/offline-register', auth, role(['sales']), userController.offlineRegister);

module.exports = router;
