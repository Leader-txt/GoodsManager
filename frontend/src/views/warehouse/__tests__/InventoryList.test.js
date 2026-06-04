import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import InventoryList from '../InventoryList.vue';

vi.mock('@/api/inventory', () => ({
  getInventory: vi.fn().mockResolvedValue({
    code: 200,
    data: { list: [{ id:1, product_id:1, product_name:'测试商品', category:'笔记本电脑', shelf_code:'1-1-1', quantity:10, updated_at:'2024-06-01 10:00:00' }], total: 1 },
  }),
}));
vi.mock('@/api/product', () => ({
  getCategories: vi.fn().mockResolvedValue({ code: 200, data: ['笔记本电脑', '鼠标'] }),
}));

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: {} }, { path: '/warehouse', component: {} }, { path: '/warehouse/inventory/:productId', component: {} }, { path: '/warehouse/stock-in', component: {} }, { path: '/warehouse/stock-out', component: {} }],
});

describe('InventoryList.vue', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page title and action buttons', async () => {
    const wrapper = mount(InventoryList, { global: { plugins: [router] } });
    expect(wrapper.find('h2').text()).toBe('库存总览');
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('入库');
    expect(wrapper.text()).toContain('出库');
  });

  it('renders filter inputs', () => {
    const wrapper = mount(InventoryList, { global: { plugins: [router] } });
    expect(wrapper.find('input[placeholder*="搜索"]').exists()).toBe(true);
    expect(wrapper.findAll('select').length).toBeGreaterThanOrEqual(2);
  });

  it('has router-link for stock-in', () => {
    const wrapper = mount(InventoryList, { global: { plugins: [router] } });
    const links = wrapper.findAll('a');
    const stockInLink = links.find(l => l.attributes('href') === '/warehouse/stock-in');
    expect(stockInLink).toBeTruthy();
  });
});
