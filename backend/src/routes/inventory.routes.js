const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const { validateId } = require('../middlewares/validator');

// 所有接口需认证
router.use(auth);

// 货架管理 (仓库操作员)
router.get('/shelves', inventoryController.listShelves);
router.post('/shelves', role(['warehouse', 'admin']), inventoryController.createShelf);
router.put('/shelves/:id', role(['warehouse', 'admin']), validateId('id'), inventoryController.updateShelf);
router.delete('/shelves/:id', role(['warehouse', 'admin']), validateId('id'), inventoryController.deleteShelf);

// 库存查询
router.get('/inventory', inventoryController.listInventory);
router.get('/inventory/:productId', validateId('productId'), inventoryController.getInventoryDetail);

// 出入库操作 (仓库操作员)
router.post('/stock-in', role(['warehouse', 'admin']), inventoryController.stockIn);
router.post('/stock-out', role(['warehouse', 'admin']), inventoryController.stockOut);
router.post('/stock-out-batch', role(['warehouse', 'admin']), inventoryController.stockOutBatch);

module.exports = router;
