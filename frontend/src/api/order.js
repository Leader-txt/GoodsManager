import api from './index';

export function createOrder(data) {
  return api.post('/orders', data);
}

export function getOrders(params) {
  return api.get('/orders', { params });
}

export function getOrderDetail(id) {
  return api.get(`/orders/${id}`);
}

export function getOrderByOrderNo(orderNo) {
  return api.get(`/orders/by-no/${orderNo}`);
}

export function payOrder(id) {
  return api.put(`/orders/${id}/pay`);
}

export function cancelOrder(id) {
  return api.put(`/orders/${id}/cancel`);
}

export function signOrder(id) {
  return api.put(`/orders/${id}/sign`);
}

export function createOfflineOrder(data) {
  return api.post('/orders/offline', data);
}

export function getSalesOrders(params) {
  return api.get('/orders/sales', { params });
}

export function getWarehouseOrders(params) {
  return api.get('/orders/warehouse', { params });
}
