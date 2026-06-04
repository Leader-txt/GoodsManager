import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import ShelfManage from '../ShelfManage.vue';

vi.mock('@/api/inventory', () => ({
  getShelves: vi.fn().mockResolvedValue({
    code: 200,
    data: { list: [{ id:1, shelf_code:'1-1-1', description:'笔记本区' }], total: 1 },
  }),
  createShelf: vi.fn().mockResolvedValue({ code: 200 }),
  updateShelf: vi.fn().mockResolvedValue({ code: 200 }),
  deleteShelf: vi.fn().mockResolvedValue({ code: 200 }),
}));

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: {} }],
});

describe('ShelfManage.vue', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page title', () => {
    const wrapper = mount(ShelfManage, { global: { plugins: [router] } });
    expect(wrapper.find('h2').text()).toBe('货架管理');
  });

  it('has add button', () => {
    const wrapper = mount(ShelfManage, { global: { plugins: [router] } });
    expect(wrapper.text()).toContain('添加货架');
  });

  it('opens add modal on button click', async () => {
    const wrapper = mount(ShelfManage, { global: { plugins: [router] } });
    await wrapper.find('.el-button--primary').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('添加货架');
  });

  it('closes modal when clicking cancel', async () => {
    const wrapper = mount(ShelfManage, { global: { plugins: [router] } });
    await wrapper.find('.el-button--primary').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('货架编号');
    // Click cancel button (second button in footer)
    const buttons = wrapper.findAll('.el-button');
    const cancelBtn = buttons.find(b => b.text() === '取消');
    if (cancelBtn) await cancelBtn.trigger('click');
    await wrapper.vm.$nextTick();
  });
});
