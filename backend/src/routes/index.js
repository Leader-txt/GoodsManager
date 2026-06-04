const express = require('express');
const { success } = require('../utils/response');

const router = express.Router();

// 健康检查
router.get('/health', (req, res) => {
  res.json(success(null, 'ok'));
});

// 认证与用户模块
router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/customers', require('./customer.routes'));

// 商品模块 (公开浏览)
router.use('/products', require('./product.routes'));

// 管理员接口 (商品管理 + 后续模块)
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const { validateId } = require('../middlewares/validator');
const productController = require('../controllers/product.controller');
router.post('/admin/products', auth, role(['admin']), productController.create);
router.put('/admin/products/:id', auth, role(['admin']), validateId('id'), productController.update);
router.patch('/admin/products/:id/status', auth, role(['admin']), validateId('id'), productController.updateStatus);
router.delete('/admin/products/:id', auth, role(['admin']), validateId('id'), productController.delete);
router.get('/admin/products', auth, role(['admin']), productController.listAdmin);

// 购物车模块
router.use('/cart', require('./cart.routes'));

// 订单模块
router.use('/orders', require('./order.routes'));

// 库存模块 (货架 + 库存 + 出入库)
router.use('/', require('./inventory.routes'));

// 管理后台
const adminController = require('../controllers/admin.controller');
router.get('/admin/dashboard', auth, role(['admin']), adminController.dashboard);
router.get('/admin/sales', auth, role(['admin']), adminController.listSales);
router.post('/admin/sales', auth, role(['admin']), adminController.createSales);
router.delete('/admin/sales/:id', auth, role(['admin']), validateId('id'), adminController.deleteSales);
router.post('/admin/sales/:id/reset-password', auth, role(['admin']), validateId('id'), adminController.resetPassword);
router.get('/admin/orders', auth, role(['admin']), adminController.listOrders);
router.get('/admin/inventory-logs', auth, role(['admin']), adminController.listInventoryLogs);
router.get('/admin/system-logs', auth, role(['admin']), adminController.querySystemLogs);
router.get('/admin/operators', auth, role(['admin']), adminController.listOperators);

module.exports = router;
