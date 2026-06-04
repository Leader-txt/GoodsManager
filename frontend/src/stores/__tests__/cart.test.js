/**
 * Cart Store 测试
 * 覆盖: stores/cart.js (computed, toggleSelect, toggleSelectAll, clearSelected, removeItem, updateQuantity)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCartStore } from '../cart';

// Mock the API module so store methods don't make real HTTP requests
vi.mock('@/api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ code: 200, data: { items: [] } })),
    post: vi.fn(() => Promise.resolve({ code: 200 })),
    put: vi.fn(() => Promise.resolve({ code: 200 })),
    delete: vi.fn(() => Promise.resolve({ code: 200 })),
  },
}));

describe('Cart Store (stores/cart.js)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  // ==========================================================
  // 初始状态
  // ==========================================================
  describe('初始状态', () => {
    it('初始 items 为空数组', () => {
      const store = useCartStore();
      expect(store.items).toEqual([]);
    });

    it('初始 count 为 0', () => {
      const store = useCartStore();
      expect(store.count).toBe(0);
    });

    it('初始 totalAmount 为 0', () => {
      const store = useCartStore();
      expect(store.totalAmount).toBe(0);
    });

    it('初始 selectedItems 为空数组', () => {
      const store = useCartStore();
      expect(store.selectedItems).toEqual([]);
    });
  });

  // ==========================================================
  // Cart Item 操作 (直接操作 items)
  // ==========================================================
  describe('购物车操作', () => {
    function populateCart(store) {
      store.items = [
        { id: 1, productId: 1, productName: '笔记本', price: 8999, quantity: 1, selected: true },
        { id: 2, productId: 2, productName: '平板', price: 2299, quantity: 2, selected: true },
        { id: 3, productId: 3, productName: '鼠标', price: 59, quantity: 1, selected: false },
      ];
    }

    it('count 返回购物车项数', () => {
      const store = useCartStore();
      populateCart(store);
      expect(store.count).toBe(3);
    });

    it('selectedItems 只返回选中的项', () => {
      const store = useCartStore();
      populateCart(store);
      expect(store.selectedItems).toHaveLength(2);
    });

    it('totalAmount 计算选中商品总价', () => {
      const store = useCartStore();
      populateCart(store);
      // 8999*1 + 2299*2 = 8999 + 4598 = 13597
      expect(store.totalAmount).toBe(13597);
    });

    it('空购物车 totalAmount 为 0', () => {
      const store = useCartStore();
      expect(store.totalAmount).toBe(0);
    });
  });

  // ==========================================================
  // toggleSelect
  // ==========================================================
  describe('toggleSelect()', () => {
    it('切换选中状态', () => {
      const store = useCartStore();
      store.items = [
        { id: 1, productId: 1, productName: 'Item', price: 100, quantity: 1, selected: true },
      ];
      store.toggleSelect(1);
      expect(store.items[0].selected).toBe(false);

      store.toggleSelect(1);
      expect(store.items[0].selected).toBe(true);
    });
  });

  // ==========================================================
  // toggleSelectAll
  // ==========================================================
  describe('toggleSelectAll()', () => {
    it('全部选中时取消全选', () => {
      const store = useCartStore();
      store.items = [
        { id: 1, productId: 1, productName: 'A', price: 10, quantity: 1, selected: true },
        { id: 2, productId: 2, productName: 'B', price: 20, quantity: 1, selected: true },
      ];
      store.toggleSelectAll();
      expect(store.items.every(i => !i.selected)).toBe(true);
    });

    it('部分选中时全选', () => {
      const store = useCartStore();
      store.items = [
        { id: 1, productId: 1, productName: 'A', price: 10, quantity: 1, selected: true },
        { id: 2, productId: 2, productName: 'B', price: 20, quantity: 1, selected: false },
      ];
      store.toggleSelectAll();
      expect(store.items.every(i => i.selected)).toBe(true);
    });

    it('全部未选中时全选', () => {
      const store = useCartStore();
      store.items = [
        { id: 1, productId: 1, productName: 'A', price: 10, quantity: 1, selected: false },
        { id: 2, productId: 2, productName: 'B', price: 20, quantity: 1, selected: false },
      ];
      store.toggleSelectAll();
      expect(store.items.every(i => i.selected)).toBe(true);
    });
  });

  // ==========================================================
  // clearSelected
  // ==========================================================
  describe('clearSelected()', () => {
    it('移除所有选中项', () => {
      const store = useCartStore();
      store.items = [
        { id: 1, productId: 1, productName: 'A', price: 10, quantity: 1, selected: true },
        { id: 2, productId: 2, productName: 'B', price: 20, quantity: 1, selected: false },
      ];
      store.clearSelected();
      expect(store.items).toHaveLength(1);
      expect(store.items[0].id).toBe(2);
    });

    it('全部选中时清空购物车', () => {
      const store = useCartStore();
      store.items = [
        { id: 1, productId: 1, productName: 'A', price: 10, quantity: 1, selected: true },
      ];
      store.clearSelected();
      expect(store.items).toHaveLength(0);
    });
  });

  // ==========================================================
  // removeItem
  // ==========================================================
  describe('removeItem()', () => {
    it('移除指定项', async () => {
      const store = useCartStore();
      store.items = [
        { id: 1, productId: 1, productName: 'A', price: 10, quantity: 1, selected: true },
        { id: 2, productId: 2, productName: 'B', price: 20, quantity: 1, selected: true },
      ];
      await store.removeItem(1);
      expect(store.items).toHaveLength(1);
      expect(store.items[0].id).toBe(2);
      expect(store.count).toBe(1);
    });
  });

  // ==========================================================
  // updateQuantity
  // ==========================================================
  describe('updateQuantity()', () => {
    it('更新指定项数量', async () => {
      const store = useCartStore();
      store.items = [
        { id: 1, productId: 1, productName: 'A', price: 100, quantity: 1, selected: true },
      ];
      await store.updateQuantity(1, 5);
      expect(store.items[0].quantity).toBe(5);
      expect(store.totalAmount).toBe(500);
    });

    it('不存在的项不抛错', async () => {
      const store = useCartStore();
      await expect(store.updateQuantity(999, 5)).resolves.not.toThrow();
    });
  });
});
