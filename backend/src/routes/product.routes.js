const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { validateId } = require('../middlewares/validator');

// 公开接口
router.get('/categories', productController.categories);
router.get('/brands', productController.brands);
router.get('/', productController.list);
router.get('/:id', validateId('id'), productController.detail);

module.exports = router;
