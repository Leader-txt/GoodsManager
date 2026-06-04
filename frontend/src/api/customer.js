import api from './index';

export function searchCustomers(keyword) {
  return api.get('/customers/search', { params: { keyword } });
}
