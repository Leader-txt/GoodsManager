import api from './index';

export function getProfile() {
  return api.get('/users/profile');
}

export function updatePhone(phone) {
  return api.put('/users/phone', { phone });
}

export function updateAddress(address) {
  return api.put('/users/address', { address });
}

export function offlineRegister(data) {
  return api.post('/users/offline-register', data);
}
