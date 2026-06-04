/**
 * Auth Store 测试
 * 覆盖: stores/auth.js (login, logout, updateUser, computed properties)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../auth';

describe('Auth Store (stores/auth.js)', () => {
  beforeEach(() => {
    // 每个测试用全新的 Pinia 实例
    setActivePinia(createPinia());
    localStorage.clear();
  });

  // ==========================================================
  // 初始状态
  // ==========================================================
  describe('初始状态', () => {
    it('初始时 token 为空字符串', () => {
      const store = useAuthStore();
      expect(store.token).toBe('');
    });

    it('初始时 user 为 null', () => {
      const store = useAuthStore();
      expect(store.user).toBeNull();
    });

    it('初始时 isLoggedIn 为 false', () => {
      const store = useAuthStore();
      expect(store.isLoggedIn).toBe(false);
    });

    it('初始时 role 为空字符串', () => {
      const store = useAuthStore();
      expect(store.role).toBe('');
    });
  });

  // ==========================================================
  // login
  // ==========================================================
  describe('login()', () => {
    it('设置 token 和 user', () => {
      const store = useAuthStore();
      store.login('test-token-abc', { id: 1, username: 'testuser', role: 'customer' });

      expect(store.token).toBe('test-token-abc');
      expect(store.user).toEqual({ id: 1, username: 'testuser', role: 'customer' });
      expect(store.isLoggedIn).toBe(true);
      expect(store.role).toBe('customer');
    });

    it('持久化到 localStorage', () => {
      const store = useAuthStore();
      store.login('persist-token', { id: 5, username: 'persist', role: 'admin' });

      expect(localStorage.getItem('token')).toBe('persist-token');
      expect(JSON.parse(localStorage.getItem('user'))).toEqual({
        id: 5, username: 'persist', role: 'admin',
      });
    });

    it('admin 角色正确设置', () => {
      const store = useAuthStore();
      store.login('admin-token', { id: 1, username: 'admin', role: 'admin' });
      expect(store.role).toBe('admin');
    });

    it('sales 角色正确设置', () => {
      const store = useAuthStore();
      store.login('sales-token', { id: 3, username: 'sales01', role: 'sales' });
      expect(store.role).toBe('sales');
    });
  });

  // ==========================================================
  // logout
  // ==========================================================
  describe('logout()', () => {
    it('清空 token 和 user', () => {
      const store = useAuthStore();
      store.login('logout-test', { id: 1, username: 'a', role: 'customer' });
      store.logout();

      expect(store.token).toBe('');
      expect(store.user).toBeNull();
      expect(store.isLoggedIn).toBe(false);
      expect(store.role).toBe('');
    });

    it('移除 localStorage', () => {
      const store = useAuthStore();
      store.login('clear-test', { id: 2, username: 'b', role: 'customer' });
      store.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  // ==========================================================
  // updateUser
  // ==========================================================
  describe('updateUser()', () => {
    it('合并更新 user 对象', () => {
      const store = useAuthStore();
      store.login('update-token', { id: 1, username: 'oldname', role: 'customer' });
      store.updateUser({ username: 'newname' });

      expect(store.user.username).toBe('newname');
      expect(store.user.role).toBe('customer'); // 未改变的属性保留
      expect(store.user.id).toBe(1);
    });

    it('更新后持久化到 localStorage', () => {
      const store = useAuthStore();
      store.login('persist2', { id: 4, username: 'name1', role: 'customer' });
      store.updateUser({ username: 'name2' });

      const stored = JSON.parse(localStorage.getItem('user'));
      expect(stored.username).toBe('name2');
    });
  });

  // ==========================================================
  // 从 localStorage 恢复
  // ==========================================================
  describe('从 localStorage 恢复状态', () => {
    it('构造时自动读取 localStorage', () => {
      localStorage.setItem('token', 'saved-token');
      localStorage.setItem('user', JSON.stringify({ id: 10, username: 'saved', role: 'warehouse' }));

      const store = useAuthStore();
      expect(store.token).toBe('saved-token');
      expect(store.user.id).toBe(10);
      expect(store.role).toBe('warehouse');
    });
  });
});
