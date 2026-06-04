import api from './index';

export function getDashboard() { return api.get('/admin/dashboard'); }

export function getSales(params) { return api.get('/admin/sales', { params }); }
export function createSales(data) { return api.post('/admin/sales', data); }
export function deleteSales(id) { return api.delete(`/admin/sales/${id}`); }
export function resetPassword(id) { return api.post(`/admin/sales/${id}/reset-password`); }

export function getAdminOrders(params) { return api.get('/admin/orders', { params }); }
export function getInventoryLogs(params) { return api.get('/admin/inventory-logs', { params }); }
export function getSystemLogs(params) { return api.get('/admin/system-logs', { params }); }
export function getOperators() { return api.get('/admin/operators'); }
