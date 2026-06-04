import api from './index';

export function getProducts(params) {
  return api.get('/products', { params });
}

export function getProductDetail(id) {
  return api.get(`/products/${id}`);
}

export function getCategories() {
  return api.get('/products/categories');
}

export function getBrands() {
  return api.get('/products/brands');
}

// 管理员接口
export function createProduct(data) {
  return api.post('/admin/products', data);
}

export function updateProduct(id, data) {
  return api.put(`/admin/products/${id}`, data);
}

export function updateProductStatus(id, status) {
  return api.patch(`/admin/products/${id}/status`, { status });
}

export function deleteProduct(id) {
  return api.delete(`/admin/products/${id}`);
}

export function getAdminProducts(params) {
  return api.get('/admin/products', { params });
}
