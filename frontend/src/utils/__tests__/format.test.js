/**
 * 前端格式化工具测试
 * 覆盖: format.js 所有格式化函数
 */
import { describe, it, expect } from 'vitest';
import {
  formatPrice,
  formatDate,
  formatDateOnly,
  getOrderStatusText,
  getOrderStatusColor,
  ORDER_STATUS_MAP,
} from '../format';

describe('格式化工具 (utils/format.js)', () => {
  // ==========================================================
  // 价格格式化
  // ==========================================================
  describe('formatPrice()', () => {
    it('整数价格', () => {
      const result = formatPrice(8999);
      expect(result).toContain('¥');
      expect(result).toContain('8,999.00');
    });

    it('小数价格', () => {
      const result = formatPrice(129.5);
      expect(result).toContain('¥');
      expect(result).toContain('129.50');
    });

    it('0 价格', () => {
      const result = formatPrice(0);
      expect(result).toContain('0.00');
    });

    it('null 返回 ¥0.00', () => {
      expect(formatPrice(null)).toBe('¥0.00');
    });

    it('undefined 返回 ¥0.00', () => {
      expect(formatPrice(undefined)).toBe('¥0.00');
    });

    it('字符串数字可处理', () => {
      const result = formatPrice('1999');
      expect(result).toContain('1,999.00');
    });

    it('价格以 ¥ 开头', () => {
      expect(formatPrice(100)).toMatch(/^¥/);
    });
  });

  // ==========================================================
  // 日期时间格式化
  // ==========================================================
  describe('formatDate()', () => {
    it('格式化 ISO 日期字符串', () => {
      const result = formatDate('2026-06-03T12:30:45');
      expect(result).toContain('2026');
      expect(result).toContain('06');
      expect(result).toContain('03');
      // 格式: YYYY-MM-DD HH:mm:ss
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it('空字符串返回空字符串', () => {
      expect(formatDate('')).toBe('');
    });

    it('null 返回空字符串', () => {
      expect(formatDate(null)).toBe('');
    });

    it('undefined 返回空字符串', () => {
      expect(formatDate(undefined)).toBe('');
    });
  });

  // ==========================================================
  // 日期格式化 (不含时间)
  // ==========================================================
  describe('formatDateOnly()', () => {
    it('格式化日期不含时间', () => {
      const result = formatDateOnly('2026-01-15T08:00:00');
      expect(result).toBe('2026-01-15');
      expect(result).not.toContain(':');
    });

    it('空值返回空字符串', () => {
      expect(formatDateOnly('')).toBe('');
      expect(formatDateOnly(null)).toBe('');
    });
  });

  // ==========================================================
  // 订单状态映射
  // ==========================================================
  describe('getOrderStatusText()', () => {
    it('pending → 待支付', () => {
      expect(getOrderStatusText('pending')).toBe('待支付');
    });

    it('paid → 已支付', () => {
      expect(getOrderStatusText('paid')).toBe('已支付');
    });

    it('shipped → 已出库', () => {
      expect(getOrderStatusText('shipped')).toBe('已出库');
    });

    it('delivering → 配送中', () => {
      expect(getOrderStatusText('delivering')).toBe('配送中');
    });

    it('signed → 已签收', () => {
      expect(getOrderStatusText('signed')).toBe('已签收');
    });

    it('cancelled → 已取消', () => {
      expect(getOrderStatusText('cancelled')).toBe('已取消');
    });

    it('未知状态返回原值', () => {
      expect(getOrderStatusText('unknown')).toBe('unknown');
    });

    it('ORDER_STATUS_MAP 包含6种状态', () => {
      const keys = Object.keys(ORDER_STATUS_MAP);
      expect(keys).toHaveLength(6);
      expect(keys).toContain('pending');
      expect(keys).toContain('signed');
    });
  });

  // ==========================================================
  // 订单状态颜色
  // ==========================================================
  describe('getOrderStatusColor()', () => {
    it('各状态返回 hex 颜色值', () => {
      const statuses = ['pending', 'paid', 'shipped', 'delivering', 'signed', 'cancelled'];
      statuses.forEach(status => {
        const color = getOrderStatusColor(status);
        expect(color).toMatch(/^#[0-9a-fA-F]{3,6}$/);
      });
    });

    it('未知状态返回 #999', () => {
      expect(getOrderStatusColor('unknown')).toBe('#999');
    });

    it('pending 为警告色', () => {
      expect(getOrderStatusColor('pending')).toBe('#faad14');
    });

    it('signed 为绿色', () => {
      expect(getOrderStatusColor('signed')).toBe('#52c41a');
    });

    it('cancelled 为灰色', () => {
      expect(getOrderStatusColor('cancelled')).toBe('#999');
    });
  });
});
