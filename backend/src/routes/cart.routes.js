const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const { validateId } = require('../middlewares/validator');

// 所有购物车接口仅顾客可用
router.use(auth, role(['customer']));

router.get('/', cartController.list);
router.post('/', cartController.add);
router.put('/:id', validateId('id'), cartController.updateQuantity);
router.delete('/clear', cartController.clearSelected);
router.delete('/:id', validateId('id'), cartController.remove);

module.exports = router;
