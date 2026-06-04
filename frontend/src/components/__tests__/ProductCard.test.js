/**
 * ProductCard 组件测试
 */
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ProductCard from '../product/ProductCard.vue';

describe('ProductCard 组件 (components/product/ProductCard.vue)', () => {
  const mockProduct = {
    id: 1,
    name: '联想拯救者 R9000P',
    category: '笔记本电脑',
    price: '8999.00',
    image_url: '/uploads/laptop_r9000p.jpg',
    stockQuantity: 25,
  };

  // ==========================================================
  // 渲染测试
  // ==========================================================
  describe('基础渲染', () => {
    it('渲染商品名称', () => {
      const wrapper = mount(ProductCard, {
        props: { product: mockProduct },
        global: { stubs: { 'router-link': true } },
      });
      expect(wrapper.text()).toContain('联想拯救者 R9000P');
    });

    it('渲染商品分类标签', () => {
      const wrapper = mount(ProductCard, {
        props: { product: mockProduct },
        global: { stubs: { 'router-link': true } },
      });
      expect(wrapper.text()).toContain('笔记本电脑');
    });

    it('渲染价格', () => {
      const wrapper = mount(ProductCard, {
        props: { product: mockProduct },
        global: { stubs: { 'router-link': true } },
      });
      // formatPrice 格式为 ¥8,999.00
      expect(wrapper.text()).toContain('¥');
    });

    it('渲染库存信息', () => {
      const wrapper = mount(ProductCard, {
        props: { product: mockProduct },
        global: { stubs: { 'router-link': true } },
      });
      expect(wrapper.text()).toContain('库存: 25');
    });

    it('渲染查看详情链接', () => {
      const wrapper = mount(ProductCard, {
        props: { product: mockProduct },
        global: { stubs: { 'router-link': { template: '<a><slot/></a>' } } },
      });
      expect(wrapper.text()).toContain('查看详情');
    });
  });

  // ==========================================================
  // 缺货状态
  // ==========================================================
  describe('缺货状态', () => {
    const outOfStockProduct = {
      ...mockProduct,
      stockQuantity: 0,
    };

    it('库存为 0 时显示"暂时缺货"', () => {
      const wrapper = mount(ProductCard, {
        props: { product: outOfStockProduct },
        global: { stubs: { 'router-link': true } },
      });
      expect(wrapper.text()).toContain('暂时缺货');
    });

    it('库存为 0 时添加 outofstock CSS class', () => {
      const wrapper = mount(ProductCard, {
        props: { product: outOfStockProduct },
        global: { stubs: { 'router-link': true } },
      });
      expect(wrapper.classes()).toContain('outofstock');
    });

    it('有库存时不显示缺货遮罩', () => {
      const wrapper = mount(ProductCard, {
        props: { product: mockProduct },
        global: { stubs: { 'router-link': true } },
      });
      expect(wrapper.find('.outofstock-mask').exists()).toBe(false);
    });
  });

  // ==========================================================
  // 图片渲染
  // ==========================================================
  describe('图片', () => {
    it('渲染商品图片', () => {
      const wrapper = mount(ProductCard, {
        props: { product: mockProduct },
        global: { stubs: { 'router-link': true } },
      });
      const img = wrapper.find('img');
      expect(img.exists()).toBe(true);
      expect(img.attributes('src')).toBe('/uploads/laptop_r9000p.jpg');
    });

    it('无图片时使用占位图', () => {
      const wrapper = mount(ProductCard, {
        props: { product: { ...mockProduct, image_url: '' } },
        global: { stubs: { 'router-link': true } },
      });
      const img = wrapper.find('img');
      expect(img.attributes('src')).toBe('/placeholder.png');
    });
  });
});
