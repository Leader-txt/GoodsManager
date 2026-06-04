import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/api';

export const useCartStore = defineStore('cart', () => {
  const items = ref([]);

  const count = computed(() => items.value.length);
  const selectedItems = computed(() => items.value.filter(i => i.selected));
  const totalAmount = computed(() =>
    selectedItems.value.reduce((sum, i) => sum + i.price * i.quantity, 0)
  );

  async function fetchCart() {
    try {
      const res = await api.get('/cart');
      if (res.code === 200) {
        items.value = (res.data.items || []).map(item => ({
          ...item,
          selected: true,
        }));
      }
    } catch {
      items.value = [];
    }
  }

  async function addToCart(productId, quantity = 1) {
    const res = await api.post('/cart', { productId, quantity });
    if (res.code === 200) {
      await fetchCart();
    }
    return res;
  }

  async function updateQuantity(cartId, quantity) {
    const res = await api.put(`/cart/${cartId}`, { quantity });
    if (res.code === 200) {
      const item = items.value.find(i => i.id === cartId);
      if (item) item.quantity = quantity;
    }
    return res;
  }

  async function removeItem(cartId) {
    const res = await api.delete(`/cart/${cartId}`);
    if (res.code === 200) {
      items.value = items.value.filter(i => i.id !== cartId);
    }
    return res;
  }

  function toggleSelect(cartId) {
    const item = items.value.find(i => i.id === cartId);
    if (item) item.selected = !item.selected;
  }

  function toggleSelectAll() {
    const allSelected = items.value.every(i => i.selected);
    items.value.forEach(i => (i.selected = !allSelected));
  }

  function clearSelected() {
    items.value = items.value.filter(i => !i.selected);
  }

  return {
    items, count, selectedItems, totalAmount,
    fetchCart, addToCart, updateQuantity, removeItem,
    toggleSelect, toggleSelectAll, clearSelected,
  };
});
