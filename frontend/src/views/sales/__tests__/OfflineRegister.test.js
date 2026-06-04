import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import OfflineRegister from '../OfflineRegister.vue';

vi.mock('@/api/user', () => ({
  offlineRegister: vi.fn(),
}));

vi.mock('@/utils/validators', () => ({
  isValidRealName: vi.fn((v) => v && v.length >= 2 && /^[一-龥]+$/.test(v)),
  isValidIdCard: vi.fn((v) => v && v.length === 18),
  isValidPhone: vi.fn((v) => v && /^1[3-9]\d{9}$/.test(v)),
}));

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: {} }],
});

describe('OfflineRegister.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('renders the form with all required fields', () => {
    const wrapper = mount(OfflineRegister, { global: { plugins: [router] } });
    expect(wrapper.find('h2').text()).toBe('线下注册顾客');
    expect(wrapper.text()).toContain('姓名');
    expect(wrapper.text()).toContain('身份证号');
    expect(wrapper.text()).toContain('手机号');
    // Radio buttons
    const radios = wrapper.findAll('input[type="radio"]');
    expect(radios.length).toBe(2);
  });

  it('shows error when submitting with empty name', async () => {
    const wrapper = mount(OfflineRegister, { global: { plugins: [router] } });
    await wrapper.find('.el-button--primary').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('请输入正确');
  });

  it('shows error when submitting with invalid realName', async () => {
    const wrapper = mount(OfflineRegister, { global: { plugins: [router] } });
    const inputs = wrapper.findAll('input[type="text"]');
    // First visible text input should be the name field
    const nameInput = inputs.find(i => i.attributes('placeholder')?.includes('姓名'));
    if (nameInput) await nameInput.setValue('ab');
    await wrapper.find('.el-button--primary').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('请输入正确');
  });

  it('does not show result modal initially', () => {
    const wrapper = mount(OfflineRegister, { global: { plugins: [router] } });
    expect(wrapper.text()).not.toContain('注册成功');
  });

  it('has radio button for gender defaulting to 男', () => {
    const wrapper = mount(OfflineRegister, { global: { plugins: [router] } });
    const maleRadio = wrapper.find('input[value="男"]');
    expect(maleRadio.element.checked).toBe(true);
  });
});
