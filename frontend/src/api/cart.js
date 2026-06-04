import api from './index';

export function getCart() {
  return api.get('/cart');
}

export function addToCart(productId, quantity) {
  return api.post('/cart', { productId, quantity });
}

export function updateCartItem(id, quantity) {
  return api.put(`/cart/${id}`, { quantity });
}

export function removeCartItem(id) {
  return api.delete(`/cart/${id}`);
}

export function clearCartItems(ids) {
  return api.delete('/cart/clear', { data: { ids } });
}
