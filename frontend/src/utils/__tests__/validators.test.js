/**
 * 前端校验工具测试
 * 覆盖: validators.js 所有校验函数
 */
import { describe, it, expect } from 'vitest';
import {
  isValidPhone,
  isValidPassword,
  isValidIdCard,
  isValidRealName,
  isValidUsername,
} from '../validators';

describe('校验工具 (utils/validators.js)', () => {
  // ==========================================================
  // 手机号校验
  // ==========================================================
  describe('isValidPhone()', () => {
    it('有效手机号返回 true', () => {
      expect(isValidPhone('13800138000')).toBe(true);
      expect(isValidPhone('15912345678')).toBe(true);
      expect(isValidPhone('18800009999')).toBe(true);
    });

    it('137 号段', () => {
      expect(isValidPhone('13712345678')).toBe(true);
    });

    it('13 开头但第3位不是1-9', () => {
      expect(isValidPhone('130123456789')).toBe(false);
    });

    it('空字符串', () => {
      expect(isValidPhone('')).toBe(false);
    });

    it('长度不足11位', () => {
      expect(isValidPhone('1380013800')).toBe(false);
    });

    it('长度超过11位', () => {
      expect(isValidPhone('138001380001')).toBe(false);
    });

    it('包含字母', () => {
      expect(isValidPhone('1380013800a')).toBe(false);
    });

    it('以2开头', () => {
      expect(isValidPhone('23800138000')).toBe(false);
    });

    it('undefined 和 null', () => {
      expect(isValidPhone(undefined)).toBe(false);
      expect(isValidPhone(null)).toBe(false);
    });
  });

  // ==========================================================
  // 密码校验
  // ==========================================================
  describe('isValidPassword()', () => {
    it('有效密码: 6位字母+数字', () => {
      expect(isValidPassword('abc123')).toBe(true);
    });

    it('有效密码: 20位字母+数字', () => {
      expect(isValidPassword('abcdefgh1234567890')).toBe(true);
    });

    it('纯数字密码应失败', () => {
      expect(isValidPassword('123456')).toBe(false);
    });

    it('纯字母密码应失败', () => {
      expect(isValidPassword('abcdef')).toBe(false);
    });

    it('长度小于6', () => {
      expect(isValidPassword('ab123')).toBe(false);
    });

    it('长度超过20', () => {
      expect(isValidPassword('abc1234567890123456789')).toBe(false);
    });

    it('空字符串', () => {
      expect(isValidPassword('')).toBe(false);
    });

    it('null', () => {
      expect(isValidPassword(null)).toBe(false);
    });

    it('特殊字符+字母+数字', () => {
      expect(isValidPassword('a!1b@2c#3')).toBe(true);
    });
  });

  // ==========================================================
  // 身份证号校验
  // ==========================================================
  describe('isValidIdCard()', () => {
    it('有效18位身份证', () => {
      expect(isValidIdCard('110101199003076691')).toBe(true);
    });

    it('有效18位以X结尾', () => {
      expect(isValidIdCard('11010119900100001X')).toBe(true);
    });

    it('小写x结尾', () => {
      expect(isValidIdCard('11010119900100001x')).toBe(true);
    });

    it('长度不为18', () => {
      expect(isValidIdCard('12345678901234567')).toBe(false);
      expect(isValidIdCard('1234567890123456789')).toBe(false);
    });

    it('包含非法字符', () => {
      expect(isValidIdCard('11010119900307663a')).toBe(false);
    });

    it('空值', () => {
      expect(isValidIdCard('')).toBe(false);
      expect(isValidIdCard(null)).toBe(false);
    });

    it('校验位不正确', () => {
      expect(isValidIdCard('110101199003076630')).toBe(false);
    });
  });

  // ==========================================================
  // 姓名校验
  // ==========================================================
  describe('isValidRealName()', () => {
    it('2个字中文姓名', () => {
      expect(isValidRealName('张三')).toBe(true);
    });

    it('3个字中文姓名', () => {
      expect(isValidRealName('欧阳正')).toBe(true);
    });

    it('20个字中文姓名 (边界)', () => {
      expect(isValidRealName('测试测试测试测试测试测试测试测试测试测试')).toBe(true);
    });

    it('单字姓名应失败', () => {
      expect(isValidRealName('张')).toBe(false);
    });

    it('超过20字', () => {
      expect(isValidRealName('测试测试测试测试测试测试测试测试测试测试试')).toBe(false);
    });

    it('包含英文字母', () => {
      expect(isValidRealName('Tom')).toBe(false);
    });

    it('空字符串', () => {
      expect(isValidRealName('')).toBe(false);
    });
  });

  // ==========================================================
  // 用户名校验
  // ==========================================================
  describe('isValidUsername()', () => {
    it('4位用户名', () => {
      expect(isValidUsername('ab12')).toBe(true);
    });

    it('20位用户名', () => {
      expect(isValidUsername('abcdefgh123456789012')).toBe(true);
    });

    it('长度不足4', () => {
      expect(isValidUsername('abc')).toBe(false);
    });

    it('包含特殊字符', () => {
      expect(isValidUsername('admin@test')).toBe(false);
    });

    it('包含中文', () => {
      expect(isValidUsername('管理员账号')).toBe(false);
    });

    it('空值', () => {
      expect(isValidUsername('')).toBe(false);
    });

    it('混合大小写', () => {
      expect(isValidUsername('AdminTest2024')).toBe(true);
    });
  });
});
