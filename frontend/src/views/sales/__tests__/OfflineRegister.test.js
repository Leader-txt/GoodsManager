import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import OfflineRegister from '../OfflineRegister.vue';

// Mock the user API
vi.mock('@/api/user', () => ({
  offlineRegister: vi.fn(),
}));

// Mock validators
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
    const wrapper = mount(OfflineRegister, {
      global: { plugins: [router] },
    });
    expect(wrapper.find('h2').text()).toBe('线下注册顾客');
    expect(wrapper.find('input[placeholder*="姓名"]').exists()).toBe(true);
    expect(wrapper.find('input[placeholder*="身份证"]').exists()).toBe(true);
    expect(wrapper.find('input[placeholder*="手机号"]').exists()).toBe(true);
    // Radio buttons
    const radios = wrapper.findAll('input[type="radio"]');
    expect(radios.length).toBe(2);
  });

  it('shows error when submitting with empty name', async () => {
    const wrapper = mount(OfflineRegister, {
      global: { plugins: [router] },
    });
    await wrapper.find('.btn-submit').trigger('click');
    const err = wrapper.find('.err-msg');
    expect(err.exists()).toBe(true);
  });

  it('shows error when submitting with invalid realName', async () => {
    const wrapper = mount(OfflineRegister, {
      global: { plugins: [router] },
    });
    await wrapper.find('input[placeholder*="姓名"]').setValue('ab');
    await wrapper.find('.btn-submit').trigger('click');
    const err = wrapper.find('.err-msg');
    expect(err.exists()).toBe(true);
  });

  it('does not show result modal initially', () => {
    const wrapper = mount(OfflineRegister, {
      global: { plugins: [router] },
    });
    expect(wrapper.find('.modal-overlay').exists()).toBe(false);
  });

  it('has radio button for gender defaulting to 男', () => {
    const wrapper = mount(OfflineRegister, {
      global: { plugins: [router] },
    });
    const maleRadio = wrapper.find('input[value="男"]');
    expect(maleRadio.element.checked).toBe(true);
  });
});
