import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import StockIn from '../StockIn.vue';

vi.mock('@/api/inventory', () => ({
  stockIn: vi.fn().mockResolvedValue({ code: 200, data: {} }),
  getShelves: vi.fn().mockResolvedValue({
    code: 200,
    data: { list: [{ id:1, shelf_code:'1-1-1', description:'笔记本区' }] },
  }),
}));
vi.mock('@/api/product', () => ({
  getProducts: vi.fn().mockResolvedValue({
    code: 200,
    data: { list: [{ id:1, name:'测试商品', category:'笔记本电脑', price:8999, stockQuantity:10 }] },
  }),
}));

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/warehouse', component: {} }],
});

describe('StockIn.vue', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page title', () => {
    const wrapper = mount(StockIn, { global: { plugins: [router] } });
    expect(wrapper.find('h2').text()).toBe('商品入库');
  });

  it('renders form fields', () => {
    const wrapper = mount(StockIn, { global: { plugins: [router] } });
    expect(wrapper.text()).toContain('商品');
    expect(wrapper.text()).toContain('目标货架');
    expect(wrapper.text()).toContain('入库数量');
  });

  it('shows error when submitting without product', async () => {
    const wrapper = mount(StockIn, { global: { plugins: [router] } });
    await wrapper.find('.el-button--primary').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('请选择商品');
  });
});
