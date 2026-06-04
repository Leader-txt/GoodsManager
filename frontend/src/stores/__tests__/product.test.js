/**
 * Product Store 测试
 * 覆盖: stores/product.js (setFilters, resetFilters)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useProductStore } from '../product';

describe('Product Store (stores/product.js)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('初始状态', () => {
    it('list 初始为空数组', () => {
      const store = useProductStore();
      expect(store.list).toEqual([]);
    });

    it('total 初始为 0', () => {
      const store = useProductStore();
      expect(store.total).toBe(0);
    });

    it('currentPage 默认为 1', () => {
      const store = useProductStore();
      expect(store.currentPage).toBe(1);
    });

    it('pageSize 默认为 12', () => {
      const store = useProductStore();
      expect(store.pageSize).toBe(12);
    });

    it('filters 默认值', () => {
      const store = useProductStore();
      expect(store.filters).toEqual({
        keyword: '',
        category: '',
        brand: '',
        sort: 'default',
      });
    });
  });

  describe('setFilters()', () => {
    it('更新筛选条件并重置页码', () => {
      const store = useProductStore();
      store.currentPage = 5;
      store.setFilters({ keyword: '联想', category: '笔记本电脑' });
      expect(store.filters.keyword).toBe('联想');
      expect(store.filters.category).toBe('笔记本电脑');
      expect(store.currentPage).toBe(1); // 重置
      // 未传入的保持原值
      expect(store.filters.brand).toBe('');
      expect(store.filters.sort).toBe('default');
    });

    it('单独更新品牌', () => {
      const store = useProductStore();
      store.setFilters({ brand: '联想' });
      expect(store.filters.brand).toBe('联想');
    });

    it('sort 筛选', () => {
      const store = useProductStore();
      store.setFilters({ sort: 'price_asc' });
      expect(store.filters.sort).toBe('price_asc');
    });
  });

  describe('resetFilters()', () => {
    it('重置所有筛选条件为默认值', () => {
      const store = useProductStore();
      store.setFilters({ keyword: '搜索词', category: '笔记本电脑', brand: '联想', sort: 'price_desc' });
      store.currentPage = 3;
      store.resetFilters();
      expect(store.filters).toEqual({
        keyword: '',
        category: '',
        brand: '',
        sort: 'default',
      });
      expect(store.currentPage).toBe(1);
    });
  });
});
