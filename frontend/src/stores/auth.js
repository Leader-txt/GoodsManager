import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '');
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

  const isLoggedIn = computed(() => !!token.value);
  const role = computed(() => user.value?.role || '');

  function login(tokenVal, userVal) {
    token.value = tokenVal;
    user.value = userVal;
    localStorage.setItem('token', tokenVal);
    localStorage.setItem('user', JSON.stringify(userVal));
  }

  function logout() {
    token.value = '';
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  function updateUser(updates) {
    user.value = { ...user.value, ...updates };
    localStorage.setItem('user', JSON.stringify(user.value));
  }

  return { token, user, isLoggedIn, role, login, logout, updateUser };
});
