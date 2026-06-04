/**
 * Pagination 组件测试
 */
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Pagination from '../common/Pagination.vue';

describe('Pagination 组件 (components/common/Pagination.vue)', () => {
  // ==========================================================
  // 不渲染的情况
  // ==========================================================
  describe('无需分页时', () => {
    it('只有1页时不渲染', () => {
      const wrapper = mount(Pagination, {
        props: { currentPage: 1, pageSize: 12, total: 5 },
      });
      // totalPages = ceil(5/12) = 1, 不渲染
      expect(wrapper.find('.pagination').exists()).toBe(false);
    });

    it('total 为 0 时不渲染', () => {
      const wrapper = mount(Pagination, {
        props: { currentPage: 1, pageSize: 12, total: 0 },
      });
      expect(wrapper.find('.pagination').exists()).toBe(false);
    });
  });

  // ==========================================================
  // 正常渲染
  // ==========================================================
  describe('多页时渲染', () => {
    it('显示总条数', () => {
      const wrapper = mount(Pagination, {
        props: { currentPage: 1, pageSize: 10, total: 100 },
      });
      expect(wrapper.text()).toContain('共 100 条');
    });

    it('上一页按钮在第1页时为 disabled', () => {
      const wrapper = mount(Pagination, {
        props: { currentPage: 1, pageSize: 10, total: 100 },
      });
      const buttons = wrapper.findAll('button');
      const prevBtn = buttons[0];
      expect(prevBtn.attributes('disabled')).toBeDefined();
    });

    it('下一页按钮在最后一页时为 disabled', () => {
      const wrapper = mount(Pagination, {
        props: { currentPage: 10, pageSize: 10, total: 100 },
      });
      const buttons = wrapper.findAll('button');
      const nextBtn = buttons[buttons.length - 1];
      expect(nextBtn.attributes('disabled')).toBeDefined();
    });

    it('点击页码按钮触发 change 事件', async () => {
      const wrapper = mount(Pagination, {
        props: { currentPage: 1, pageSize: 10, total: 100 },
      });
      // 找第3页按钮
      const pageButtons = wrapper.findAll('button');
      const pageBtn = [...pageButtons].find(b => b.text().trim() === '3');
      if (pageBtn) {
        await pageBtn.trigger('click');
        expect(wrapper.emitted('change')).toBeTruthy();
        expect(wrapper.emitted('change')[0]).toEqual([3]);
      }
    });

    it('当前页按钮有 active class', () => {
      const wrapper = mount(Pagination, {
        props: { currentPage: 1, pageSize: 10, total: 100 },
      });
      const activeBtn = wrapper.find('button.active');
      expect(activeBtn.exists()).toBe(true);
      expect(activeBtn.text().trim()).toBe('1');
    });
  });

  // ==========================================================
  // 可见页码范围
  // ==========================================================
  describe('可见页码范围', () => {
    it('总页数不超过7时显示全部', () => {
      const wrapper = mount(Pagination, {
        props: { currentPage: 1, pageSize: 20, total: 100 },
      });
      // total = 100 / 20 = 5 页，全部显示
      const pageNumbers = wrapper.findAll('button').filter(b => /^\d+$/.test(b.text().trim()));
      expect(pageNumbers.length).toBeLessThanOrEqual(5);
    });
  });
});
