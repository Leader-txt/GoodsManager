/**
 * OrderStatusTag 组件测试
 */
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import OrderStatusTag from '../order/OrderStatusTag.vue';

describe('OrderStatusTag 组件 (components/order/OrderStatusTag.vue)', () => {
  it('pending → 待支付', () => {
    const wrapper = mount(OrderStatusTag, {
      props: { status: 'pending' },
    });
    expect(wrapper.text()).toBe('待支付');
    expect(wrapper.attributes('style')).toContain('#faad14');
  });

  it('paid → 已支付', () => {
    const wrapper = mount(OrderStatusTag, {
      props: { status: 'paid' },
    });
    expect(wrapper.text()).toBe('已支付');
    expect(wrapper.attributes('style')).toContain('#1890ff');
  });

  it('shipped → 已出库', () => {
    const wrapper = mount(OrderStatusTag, {
      props: { status: 'shipped' },
    });
    expect(wrapper.text()).toBe('已出库');
  });

  it('delivering → 配送中', () => {
    const wrapper = mount(OrderStatusTag, {
      props: { status: 'delivering' },
    });
    expect(wrapper.text()).toBe('配送中');
  });

  it('signed → 已签收', () => {
    const wrapper = mount(OrderStatusTag, {
      props: { status: 'signed' },
    });
    expect(wrapper.text()).toBe('已签收');
    expect(wrapper.attributes('style')).toContain('#52c41a');
  });

  it('cancelled → 已取消 (灰色)', () => {
    const wrapper = mount(OrderStatusTag, {
      props: { status: 'cancelled' },
    });
    expect(wrapper.text()).toBe('已取消');
    expect(wrapper.attributes('style')).toContain('#999');
  });

  it('包含 order-status-tag class', () => {
    const wrapper = mount(OrderStatusTag, {
      props: { status: 'pending' },
    });
    expect(wrapper.classes()).toContain('order-status-tag');
  });
});
