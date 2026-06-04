/**
 * 后端工具函数单元测试
 * 覆盖: jwt.js, password.js, response.js
 */

const jwtUtil = require('../src/utils/jwt');
const passwordUtil = require('../src/utils/password');
const { success, error } = require('../src/utils/response');

// ============================================================
// JWT 工具测试
// ============================================================
describe('JWT 工具 (utils/jwt.js)', () => {
  const payload = { userId: 1, username: 'admin', role: 'admin' };
  let token;

  test('sign() 返回有效的 JWT 字符串', () => {
    token = jwtUtil.sign(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT 三段式
  });

  test('verify() 正确解码 payload', () => {
    const decoded = jwtUtil.verify(token);
    expect(decoded).not.toBeNull();
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.username).toBe(payload.username);
    expect(decoded.role).toBe(payload.role);
  });

  test('verify() 对非法 token 返回 null', () => {
    expect(jwtUtil.verify('invalid.token.here')).toBeNull();
    expect(jwtUtil.verify('')).toBeNull();
  });

  test('verify() 对过期 token 返回 null', () => {
    // 使用另一个 secret 签名的 token 应该返回 null
    const fakeToken = require('jsonwebtoken').sign(payload, 'wrong_secret', { expiresIn: '1h' });
    expect(jwtUtil.verify(fakeToken)).toBeNull();
  });

  test('不同 payload 生成不同 token', () => {
    const t1 = jwtUtil.sign({ userId: 1 });
    const t2 = jwtUtil.sign({ userId: 2, role: 'customer' });
    expect(t1).not.toBe(t2);
  });
});

// ============================================================
// 密码工具测试
// ============================================================
describe('密码工具 (utils/password.js)', () => {
  const plainPassword = 'MySecure123';
  const shortPassword = '12345';
  const longPassword = 'A'.repeat(21);

  test('hash() 生成 bcrypt 哈希', async () => {
    const hashed = await passwordUtil.hash(plainPassword);
    expect(typeof hashed).toBe('string');
    expect(hashed.startsWith('$2b$')).toBe(true); // bcrypt format
    expect(hashed).not.toBe(plainPassword);
  });

  test('hash() 对相同密码产生不同哈希 (salt)', async () => {
    const h1 = await passwordUtil.hash(plainPassword);
    const h2 = await passwordUtil.hash(plainPassword);
    expect(h1).not.toBe(h2);
  });

  test('compare() 正确匹配密码', async () => {
    const hashed = await passwordUtil.hash(plainPassword);
    const result = await passwordUtil.compare(plainPassword, hashed);
    expect(result).toBe(true);
  });

  test('compare() 错误密码返回 false', async () => {
    const hashed = await passwordUtil.hash(plainPassword);
    const result = await passwordUtil.compare('WrongPassword', hashed);
    expect(result).toBe(false);
  });

  test('compare() 空密码边界值', async () => {
    const hashed = await passwordUtil.hash('somepass');
    expect(await passwordUtil.compare('', hashed)).toBe(false);
  });

  test('hash() 处理短密码', async () => {
    const hashed = await passwordUtil.hash(shortPassword);
    expect(typeof hashed).toBe('string');
    expect(await passwordUtil.compare(shortPassword, hashed)).toBe(true);
  });

  test('hash() 处理长密码', async () => {
    const hashed = await passwordUtil.hash(longPassword);
    expect(await passwordUtil.compare(longPassword, hashed)).toBe(true);
  });
});

// ============================================================
// 响应格式工具测试
// ============================================================
describe('响应格式工具 (utils/response.js)', () => {
  test('success() 返回标准成功响应', () => {
    const res = success({ id: 1 }, '操作成功');
    expect(res).toEqual({
      code: 200,
      message: '操作成功',
      data: { id: 1 },
    });
  });

  test('success() 默认参数', () => {
    const res = success();
    expect(res).toEqual({
      code: 200,
      message: 'ok',
      data: null,
    });
  });

  test('success() data 为 null 时正常工作', () => {
    const res = success(null);
    expect(res.code).toBe(200);
    expect(res.data).toBeNull();
  });

  test('error() 返回标准错误响应', () => {
    const res = error(400, '参数错误');
    expect(res).toEqual({
      code: 400,
      message: '参数错误',
      data: null,
    });
  });

  test('error() 默认返回 500', () => {
    const res = error();
    expect(res).toEqual({
      code: 500,
      message: '服务器内部错误',
      data: null,
    });
  });

  test('error() 携带所有 HTTP 状态码', () => {
    const codes = [400, 401, 403, 404, 500];
    codes.forEach(code => {
      const res = error(code, 'test');
      expect(res.code).toBe(code);
    });
  });
});
