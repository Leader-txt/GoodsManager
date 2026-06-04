import api from './index';

// 货架
export function getShelves(params) { return api.get('/shelves', { params }); }
export function createShelf(data) { return api.post('/shelves', data); }
export function updateShelf(id, data) { return api.put(`/shelves/${id}`, data); }
export function deleteShelf(id) { return api.delete(`/shelves/${id}`); }

// 库存
export function getInventory(params) { return api.get('/inventory', { params }); }
export function getInventoryDetail(productId) { return api.get(`/inventory/${productId}`); }

// 出入库
export function stockIn(data) { return api.post('/stock-in', data); }
export function stockOut(data) { return api.post('/stock-out', data); }
export function stockOutBatch(orderNo) { return api.post('/stock-out-batch', { orderNo }); }
