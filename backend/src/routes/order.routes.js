const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const { validateId, validateOrderNo } = require('../middlewares/validator');

// 顾客接口
router.get('/', auth, orderController.list);
router.post('/', auth, role(['customer']), orderController.create);
router.get('/by-no/:orderNo', auth, validateOrderNo('orderNo'), orderController.detailByOrderNo);
router.get('/:id', auth, validateId('id'), orderController.detail);
router.put('/:id/pay', auth, role(['customer']), validateId('id'), orderController.pay);
router.put('/:id/cancel', auth, role(['customer']), validateId('id'), orderController.cancel);
router.put('/:id/sign', auth, validateId('id'), orderController.sign);

// 销售人员接口
router.get('/sales', auth, role(['sales']), orderController.listSalesOrders);
router.post('/offline', auth, role(['sales']), orderController.createOffline);

module.exports = router;
