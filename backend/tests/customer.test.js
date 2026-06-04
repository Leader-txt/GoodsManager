const { customerDao } = require('../src/dao/user.dao');
const orderDao = require('../src/dao/order.dao');
const orderService = require('../src/services/order.service');

describe('Customer DAO', () => {
  describe('search()', () => {
    it('should find customer by real_name', async () => {
      const results = await customerDao.search('测试顾客');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].real_name).toContain('测试顾客');
    });

    it('should find customer by phone', async () => {
      const results = await customerDao.search('13800138000');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].phone).toBe('13800138000');
    });

    it('should find customer by id_card partial match', async () => {
      const results = await customerDao.search('310101');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-matching keyword', async () => {
      const results = await customerDao.search('不存在的顾客名字xyz123');
      expect(results).toEqual([]);
    });

    it('should return up to 20 results', async () => {
      const results = await customerDao.search('');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeLessThanOrEqual(20);
    });
  });
});

describe('Order DAO - findBySales', () => {
  it('should return orders for a given sales_id', async () => {
    // sales01 has user ID 3 (from seed data)
    const result = await orderDao.findBySales(3, { page: 1, pageSize: 10 });
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('list');
    expect(Array.isArray(result.list)).toBe(true);
  });

  it('should return empty list for sales with no orders', async () => {
    const result = await orderDao.findBySales(99999, { page: 1, pageSize: 10 });
    expect(result.total).toBe(0);
    expect(result.list).toEqual([]);
  });

  it('should support status filter', async () => {
    const result = await orderDao.findBySales(3, { page: 1, pageSize: 10, status: 'signed' });
    expect(Array.isArray(result.list)).toBe(true);
    // All returned orders should have status 'signed' if any exist
    result.list.forEach(order => {
      expect(order.status).toBe('signed');
    });
  });
});

describe('Order Service - listBySales', () => {
  it('should paginate sales orders', async () => {
    const result = await orderService.listBySales(3, { page: 1, pageSize: 5 });
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('list');
    expect(result.list.length).toBeLessThanOrEqual(5);
  });
});
