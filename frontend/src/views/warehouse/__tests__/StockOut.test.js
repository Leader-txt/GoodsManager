import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import StockOut from '../StockOut.vue';

vi.mock('@/api/inventory', () => ({
  stockOut: vi.fn().mockResolvedValue({ code: 200, data: {} }),
  stockOutBatch: vi.fn().mockResolvedValue({ code: 200, data: {} }),
}));
vi.mock('@/api/product', () => ({
  getProducts: vi.fn().mockResolvedValue({
    code: 200,
    data: { list: [{ id:1, name:'测试商品', category:'笔记本电脑', price:8999, stockQuantity:10 }] },
  }),
}));
vi.mock('@/api/order', () => ({
  getOrderByOrderNo: vi.fn().mockResolvedValue({ code: 200, data: { id:1, order_no:'202406010001', customer_name:'张三', status:'paid', total_amount:8999, items:[] } }),
}));

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/warehouse', component: {} }],
});

describe('StockOut.vue', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page title', () => {
    const wrapper = mount(StockOut, { global: { plugins: [router] } });
    expect(wrapper.find('h2').text()).toBe('商品出库');
  });

  it('has mode tabs', () => {
    const wrapper = mount(StockOut, { global: { plugins: [router] } });
    const tabs = wrapper.findAll('.el-tabs__item');
    expect(tabs.length).toBeGreaterThanOrEqual(2);
    expect(tabs[0].text()).toContain('关联订单出库');
    expect(tabs[1].text()).toContain('手动出库');
  });

  it('defaults to order-linked mode', () => {
    const wrapper = mount(StockOut, { global: { plugins: [router] } });
    expect(wrapper.text()).toContain('关联订单号');
  });
});
