const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');

// 销售人员搜索顾客
router.get('/search', auth, role(['sales']), customerController.search);

module.exports = router;
