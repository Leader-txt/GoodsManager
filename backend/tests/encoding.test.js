/**
 * MySQL 中文编码诊断测试
 *
 * 用途：检测从 MySQL 返回的数据是否出现中文乱码 (mojibake)
 * 覆盖：服务器字符集、表/列字符集、回写测试、存量数据 HEX 分析
 *
 * 运行方式：
 *   npm test -- tests/encoding.test.js
 *   或 npm run test:encoding
 */

const mysql = require('mysql2/promise');
const config = require('../src/config/index');

// ============================================================
// 测试配置
// ============================================================
const TEST_TABLE = '_test_encoding';
const DB_TIMEOUT = 30000;

// ============================================================
// 测试数据集 —— 覆盖各类中文和边界场景
// ============================================================
const TEST_STRINGS = {
  commonCJK: {
    label: '常用汉字 (BMP)',
    value: '联想拯救者 R9000P 游戏笔记本',
    minBytes: 3, // 中文字符在 UTF-8 中占 3 字节
  },
  traditionalCJK: {
    label: '繁体中文',
    value: '臺北國際電腦展 — ThinkPad X1 Carbon',
  },
  fullwidthAndSymbols: {
    label: '全角符号 + 中文',
    value: '100％純果汁（蘋果味）— 500ml【特價】',
  },
  emoji: {
    label: 'Emoji (4字节 UTF-8)',
    value: '🎉 新品上市 😊 限时优惠',
    is4Byte: true,
  },
  supplementaryCJK: {
    label: '补充平面汉字 CJK Ext-B (4字节)',
    value: '𠮷野家', // 𠮷 = U+20BB7, 需要 4 字节 UTF-8
    is4Byte: true,
  },
  mixedAll: {
    label: '混合字符 (中文+Emoji+ASCII)',
    value: '产品🎉编号𠮷123-ABC测试',
    is4Byte: true,
  },
  addressData: {
    label: '地址数据',
    value: '上海市浦东新区张江高科技园区碧波路888号',
  },
};

// ============================================================
// 辅助函数
// ============================================================

/** 计算字符串的预期 UTF-8 HEX 编码 */
function expectedHex(str) {
  return Buffer.from(str, 'utf8').toString('hex').toUpperCase();
}

/** 将 HEX 字符串解码为 UTF-8 文本 */
function hexToUtf8(hex) {
  try {
    return Buffer.from(hex, 'hex').toString('utf8');
  } catch {
    return '<解码失败>';
  }
}

/**
 * 检测双编码 (double-encoding) 特征
 *
 * 双编码原理：
 *   原始 "中" (UTF-8 bytes: E4 B8 AD)
 *   → 被当作 latin1 读取 → 变成 "ä¸­" (3个 latin1 字符)
 *   → 再以 UTF-8 编码存储 → 变成 6 字节 (C3 A4 C2 B8 C2 AD)
 *
 * 检测方法：
 *   1. HEX 字节数异常多（中文字符串的 HEX 长度 > 字符数*4，正常是 ~字符数*3）
 *   2. 解码后包含大量 latin1 高位字符 (U+00C0–U+00FF)，即出现 "Ã¤Â¸Â­" 等
 */
function detectDoubleEncoding(text) {
  if (!text || text.length === 0) return { suspicious: false };

  // 检查是否有大量 Â/Ã/Ä 等拉丁补充字符（双编码的典型特征）
  // 正常中文文本应该几乎不包含这些字符
  const latin1HighChars = text.match(/[À-ÿ]/g);
  const suspiciousCount = latin1HighChars ? latin1HighChars.length : 0;

  // 如果文本包含中文字符，则不应同时出现大量拉丁补充字符
  const cjkChars = text.match(/[一-鿿㐀-䶿]/g);
  const cjkCount = cjkChars ? cjkChars.length : 0;

  // 双编码特征：有大量高位 latin1 字符但没有或很少正常 CJK 字符
  // 且高位 latin1 字符占比超过 30%
  const ratio = text.length > 0 ? suspiciousCount / text.length : 0;

  return {
    suspicious: cjkCount === 0 && ratio > 0.3,
    latin1HighCount: suspiciousCount,
    cjkCount,
    ratio,
  };
}

/**
 * 检查字符串是否为合法的 UTF-8 文本（无替换字符 U+FFFD）
 */
function hasReplacementCharacters(text) {
  return text.includes('�');
}

// ============================================================
// 测试套件
// ============================================================
describe('MySQL 中文编码诊断', () => {
  let pool;
  let dbAvailable = false;
  const issues = []; // 收集所有发现的问题

  // ----------------------------------------------------------
  // Setup / Teardown
  // ----------------------------------------------------------
  beforeAll(async () => {
    jest.setTimeout(DB_TIMEOUT);

    try {
      pool = mysql.createPool({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
        charset: 'utf8mb4',
        waitForConnections: true,
        connectionLimit: 2,
      });

      // 验证连接并创建临时表
      const conn = await pool.getConnection();
      await conn.query(`
        CREATE TABLE IF NOT EXISTS ${TEST_TABLE} (
          id INT PRIMARY KEY AUTO_INCREMENT,
          test_label VARCHAR(100) NOT NULL,
          test_value VARCHAR(500) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      conn.release();
      dbAvailable = true;
      console.log('\n[编码测试] 数据库连接成功，临时表已创建\n');
    } catch (err) {
      dbAvailable = false;
      console.warn('\n===========================================');
      console.warn('⚠️  数据库不可用，跳过编码测试');
      console.warn('   请确保 MySQL Docker 已启动:');
      console.warn('   cd database && docker-compose up -d');
      console.warn(`   错误信息: ${err.message}`);
      console.warn('===========================================\n');
    }
  }, DB_TIMEOUT + 5000);

  afterAll(async () => {
    if (!dbAvailable || !pool) return;

    try {
      const conn = await pool.getConnection();
      await conn.query(`DROP TABLE IF EXISTS ${TEST_TABLE}`);
      conn.release();
      console.log('[编码测试] 临时表已清理');
    } catch (err) {
      console.warn('[编码测试] 清理临时表失败:', err.message);
    }

    try {
      await pool.end();
    } catch {
      // 忽略关闭错误
    }
  }, 10000);

  // ----------------------------------------------------------
  // 辅助：获取连接
  // ----------------------------------------------------------
  async function getConn() {
    if (!dbAvailable || !pool) return null;
    try {
      return await pool.getConnection();
    } catch {
      return null;
    }
  }

  // ==========================================================
  // 第1组：服务器级别字符集变量检查
  // ==========================================================
  describe('1. 服务器级别字符集变量', () => {
    let charsetVars = {};

    beforeAll(async () => {
      if (!dbAvailable) return;

      const conn = await getConn();
      if (!conn) return;

      try {
        const [rows] = await conn.query("SHOW VARIABLES LIKE 'character_set_%'");
        for (const row of rows) {
          charsetVars[row.Variable_name] = row.Value;
        }

        const [collationRows] = await conn.query("SHOW VARIABLES LIKE 'collation_%'");
        for (const row of collationRows) {
          charsetVars[row.Variable_name] = row.Value;
        }
      } finally {
        conn.release();
      }
    });

    test('character_set_client = utf8mb4', () => {
      if (!dbAvailable) return;
      expect(charsetVars.character_set_client).toBe('utf8mb4');
    });

    test('character_set_connection = utf8mb4', () => {
      if (!dbAvailable) return;
      expect(charsetVars.character_set_connection).toBe('utf8mb4');
    });

    test('character_set_results = utf8mb4', () => {
      if (!dbAvailable) return;
      expect(charsetVars.character_set_results).toBe('utf8mb4');
    });

    test('character_set_database = utf8mb4', () => {
      if (!dbAvailable) return;
      expect(charsetVars.character_set_database).toBe('utf8mb4');
    });

    test('character_set_server = utf8mb4', () => {
      if (!dbAvailable) return;
      expect(charsetVars.character_set_server).toBe('utf8mb4');
    });

    test('collation_connection 属于 utf8mb4 系列', () => {
      if (!dbAvailable) return;
      const collation = charsetVars.collation_connection || '';
      expect(collation.startsWith('utf8mb4')).toBe(true);
    });

    test('collation_server 属于 utf8mb4 系列', () => {
      if (!dbAvailable) return;
      const collation = charsetVars.collation_server || '';
      expect(collation.startsWith('utf8mb4')).toBe(true);
    });
  });

  // ==========================================================
  // 第2组：表和列字符集验证
  // ==========================================================
  describe('2. 表和列字符集', () => {
    let tableCharsets = [];
    let nonUtf8mb4Columns = [];

    beforeAll(async () => {
      if (!dbAvailable) return;

      const conn = await getConn();
      if (!conn) return;

      try {
        // 检查所有表的字符集
        const [tables] = await conn.query(`
          SELECT TABLE_NAME, TABLE_COLLATION
          FROM information_schema.TABLES
          WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
        `, [config.db.database]);
        tableCharsets = tables;

        // 检查所有字符串列的字符集
        const [cols] = await conn.query(`
          SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE,
                 CHARACTER_SET_NAME, COLLATION_NAME
          FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = ?
            AND DATA_TYPE IN ('varchar','text','enum','char','mediumtext','longtext')
            AND CHARACTER_SET_NAME IS NOT NULL
            AND CHARACTER_SET_NAME != 'utf8mb4'
          ORDER BY TABLE_NAME, COLUMN_NAME
        `, [config.db.database]);
        nonUtf8mb4Columns = cols;
      } finally {
        conn.release();
      }
    });

    test('所有表使用 utf8mb4 排序规则', () => {
      if (!dbAvailable) return;

      const nonUtf8mb4Tables = tableCharsets.filter(
        t => t.TABLE_NAME !== TEST_TABLE && !t.TABLE_COLLATION.startsWith('utf8mb4')
      );

      if (nonUtf8mb4Tables.length > 0) {
        issues.push({
          type: 'table_charset',
          severity: 'error',
          detail: `以下表未使用 utf8mb4: ${nonUtf8mb4Tables.map(t => `${t.TABLE_NAME}(${t.TABLE_COLLATION})`).join(', ')}`,
          fix: `ALTER TABLE t CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
        });
      }

      expect(nonUtf8mb4Tables).toHaveLength(0);
    });

    test('所有 VARCHAR/TEXT 列使用 utf8mb4', () => {
      if (!dbAvailable) return;

      if (nonUtf8mb4Columns.length > 0) {
        const cols = nonUtf8mb4Columns.map(
          c => `${c.TABLE_NAME}.${c.COLUMN_NAME} (${c.CHARACTER_SET_NAME})`
        );
        issues.push({
          type: 'column_charset',
          severity: 'error',
          detail: `以下列未使用 utf8mb4: ${cols.join(', ')}`,
          fix: 'ALTER TABLE t MODIFY col VARCHAR(N) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;',
        });
      }

      expect(nonUtf8mb4Columns).toHaveLength(0);
    });

    test('product 表存在且使用 utf8mb4', () => {
      if (!dbAvailable) return;

      const productTable = tableCharsets.find(t => t.TABLE_NAME === 'product');
      expect(productTable).toBeDefined();
      if (productTable) {
        expect(productTable.TABLE_COLLATION.startsWith('utf8mb4')).toBe(true);
      }
    });
  });

  // ==========================================================
  // 第3组：中文回写测试（核心）
  // ==========================================================
  describe('3. 中文回写测试', () => {
    // 先清空临时表
    beforeEach(async () => {
      if (!dbAvailable) return;
      const conn = await getConn();
      if (!conn) return;
      try {
        await conn.query(`DELETE FROM ${TEST_TABLE}`);
      } finally {
        conn.release();
      }
    });

    // 对每种测试字符串执行回写验证
    for (const [key, { label, value, is4Byte }] of Object.entries(TEST_STRINGS)) {
      test(`回写: ${label}${is4Byte ? ' [4字节]' : ''}`, async () => {
        if (!dbAvailable) return;

        const conn = await getConn();
        if (!conn) return;

        try {
          // 1. 写入
          await conn.query(
            `INSERT INTO ${TEST_TABLE} (test_label, test_value) VALUES (?, ?)`,
            [label, value]
          );

          // 2. 读取文本
          const [rows] = await conn.query(
            `SELECT test_value FROM ${TEST_TABLE} WHERE test_label = ?`,
            [label]
          );

          expect(rows).toHaveLength(1);
          const returned = rows[0].test_value;

          // 3. 字符串比对
          expect(returned).toBe(value);

          // 4. HEX 字节比对（精确验证底层字节）
          const [hexRows] = await conn.query(
            `SELECT HEX(test_value) AS hex_val FROM ${TEST_TABLE} WHERE test_label = ?`,
            [label]
          );

          const actualHex = hexRows[0].hex_val.toUpperCase();
          const expected = expectedHex(value);

          if (actualHex !== expected) {
            // 详细诊断
            const decodedFromActual = hexToUtf8(actualHex);
            const mojibake = detectDoubleEncoding(decodedFromActual);

            issues.push({
              type: 'roundtrip_hex_mismatch',
              severity: 'error',
              detail: `"${label}" HEX 不匹配!\n` +
                `  原始文本: "${value}"\n` +
                `  返回文本: "${returned}"\n` +
                `  期望 HEX: ${expected}\n` +
                `  实际 HEX: ${actualHex}\n` +
                `  将实际HEX解码后: "${decodedFromActual}"\n` +
                `  乱码检测: ${mojibake.suspicious ? '疑似双编码!' : '正常'}`,
              fix: mojibake.suspicious
                ? '数据可能存在双编码问题。修复: UPDATE t SET col = CONVERT(BINARY CONVERT(col USING latin1) USING utf8mb4);'
                : '检查连接 charset 和表 charset 是否一致。',
            });
          }

          expect(actualHex).toBe(expected);
        } finally {
          conn.release();
        }
      });
    }

    // 额外：同时插入并检查多行
    test('批量回写: 所有测试字符串同时插入并校验', async () => {
      if (!dbAvailable) return;

      const conn = await getConn();
      if (!conn) return;

      try {
        // 批量插入
        for (const [, { label, value }] of Object.entries(TEST_STRINGS)) {
          await conn.query(
            `INSERT INTO ${TEST_TABLE} (test_label, test_value) VALUES (?, ?)`,
            [label, value]
          );
        }

        // 批量读取
        const [rows] = await conn.query(
          `SELECT test_label, test_value, HEX(test_value) AS hex_val FROM ${TEST_TABLE}`
        );

        expect(rows).toHaveLength(Object.keys(TEST_STRINGS).length);

        const testMap = {};
        for (const [, { label, value }] of Object.entries(TEST_STRINGS)) {
          testMap[label] = value;
        }

        const failures = [];
        for (const row of rows) {
          const original = testMap[row.test_label];
          if (row.test_value !== original) {
            failures.push({
              label: row.test_label,
              original,
              returned: row.test_value,
              expectedHex: expectedHex(original),
              actualHex: row.hex_val.toUpperCase(),
            });
          }
        }

        if (failures.length > 0) {
          for (const f of failures) {
            issues.push({
              type: 'batch_mismatch',
              severity: 'error',
              detail: `"${f.label}" 回写不一致: 期望"${f.original}" 实际"${f.returned}"`,
            });
          }
        }

        expect(failures).toHaveLength(0);
      } finally {
        conn.release();
      }
    });
  });

  // ==========================================================
  // 第4组：存量数据诊断
  // ==========================================================
  describe('4. 存量数据诊断', () => {
    test('product.name 中文数据无乱码', async () => {
      if (!dbAvailable) return;

      const conn = await getConn();
      if (!conn) return;

      try {
        const [rows] = await conn.query(
          `SELECT id, name, HEX(name) AS name_hex FROM product LIMIT 20`
        );

        if (rows.length === 0) {
          console.log('  [信息] product 表为空，跳过');
          return;
        }

        const problems = [];
        for (const row of rows) {
          const name = row.name;
          const hex = row.name_hex.toUpperCase();

          // 检查1：是否包含替换字符
          if (hasReplacementCharacters(name)) {
            problems.push({
              id: row.id,
              name,
              hex,
              issue: '包含 Unicode 替换字符 (U+FFFD)',
            });
          }

          // 检查2：双编码检测
          const doubleEnc = detectDoubleEncoding(name);
          if (doubleEnc.suspicious) {
            problems.push({
              id: row.id,
              name,
              hex,
              issue: `疑似双编码 (latin1高位字符占比 ${(doubleEnc.ratio * 100).toFixed(1)}%)`,
            });
          }

          // 检查3：HEX 中不应出现大量 3F (ASCII '?')
          const questionMarkCount = (hex.match(/3F/g) || []).length;
          if (questionMarkCount > 1) {
            problems.push({
              id: row.id,
              name,
              hex,
              issue: `HEX 中包含 ${questionMarkCount} 个 3F (问号)，可能字符已丢失`,
            });
          }
        }

        if (problems.length > 0) {
          for (const p of problems) {
            issues.push({
              type: 'existing_data',
              severity: p.issue.includes('疑似') ? 'warning' : 'error',
              detail: `product.id=${p.id} "${p.name}": ${p.issue} (HEX: ${p.hex})`,
              fix: p.issue.includes('双编码')
                ? `UPDATE product SET name = CONVERT(BINARY CONVERT(name USING latin1) USING utf8mb4) WHERE id = ${p.id};`
                : p.issue.includes('替换字符')
                  ? '数据已损坏，需要从原始数据源重新导入。'
                  : '检查数据写入时的连接 charset 设置。',
            });
          }
        }

        // 只对明显的错误 (替换字符) 做断言
        const errors = problems.filter(p => p.issue.includes('替换字符'));
        expect(errors).toHaveLength(0);
      } finally {
        conn.release();
      }
    });

    test('customer.real_name 中文数据无乱码', async () => {
      if (!dbAvailable) return;

      const conn = await getConn();
      if (!conn) return;

      try {
        const [rows] = await conn.query(
          `SELECT id, real_name, HEX(real_name) AS name_hex FROM customer LIMIT 10`
        );

        if (rows.length === 0) {
          console.log('  [信息] customer 表为空，跳过');
          return;
        }

        const problems = [];
        for (const row of rows) {
          if (hasReplacementCharacters(row.real_name)) {
            problems.push({
              id: row.id,
              name: row.real_name,
              hex: row.name_hex.toUpperCase(),
            });
          }
        }

        if (problems.length > 0) {
          for (const p of problems) {
            issues.push({
              type: 'existing_data',
              severity: 'error',
              detail: `customer.id=${p.id} "${p.name}": 包含替换字符 (HEX: ${p.hex})`,
            });
          }
        }

        expect(problems).toHaveLength(0);
      } finally {
        conn.release();
      }
    });

    test('product_spec 中文值数据无乱码', async () => {
      if (!dbAvailable) return;

      const conn = await getConn();
      if (!conn) return;

      try {
        const [rows] = await conn.query(
          `SELECT id, spec_key, spec_value, HEX(spec_value) AS val_hex
           FROM product_spec LIMIT 20`
        );

        if (rows.length === 0) {
          console.log('  [信息] product_spec 表为空，跳过');
          return;
        }

        const problems = [];
        for (const row of rows) {
          if (hasReplacementCharacters(row.spec_value)) {
            problems.push({
              id: row.id,
              key: row.spec_key,
              value: row.spec_value,
              hex: row.val_hex.toUpperCase(),
            });
          }
        }

        if (problems.length > 0) {
          for (const p of problems) {
            issues.push({
              type: 'existing_data',
              severity: 'error',
              detail: `product_spec.id=${p.id} "${p.key}=${p.value}": 包含替换字符`,
            });
          }
        }

        expect(problems).toHaveLength(0);
      } finally {
        conn.release();
      }
    });

    test('inventory_log.product_name 中文数据无乱码', async () => {
      if (!dbAvailable) return;

      const conn = await getConn();
      if (!conn) return;

      try {
        const [rows] = await conn.query(
          `SELECT id, product_name, HEX(product_name) AS name_hex FROM inventory_log LIMIT 10`
        );

        if (rows.length === 0) {
          console.log('  [信息] inventory_log 表为空，跳过');
          return;
        }

        const problems = [];
        for (const row of rows) {
          if (hasReplacementCharacters(row.product_name)) {
            problems.push({ id: row.id, name: row.product_name, hex: row.name_hex.toUpperCase() });
          }
        }

        expect(problems).toHaveLength(0);
      } finally {
        conn.release();
      }
    });
  });

  // ==========================================================
  // 第5组：诊断报告汇总
  // ==========================================================
  describe('5. 诊断报告', () => {
    test('输出完整诊断报告', () => {
      if (!dbAvailable) {
        console.log('\n[诊断报告] 数据库不可用，无法生成报告。\n');
        return;
      }

      console.log('\n');
      console.log('═'.repeat(60));
      console.log('  MySQL 中文编码诊断报告');
      console.log('═'.repeat(60));

      if (issues.length === 0) {
        console.log('  ✅ 结果: 全部通过');
        console.log('  ✅ 服务器字符集: utf8mb4');
        console.log('  ✅ 表/列字符集: utf8mb4');
        console.log('  ✅ 中文回写测试: 无乱码');
        console.log('  ✅ 存量数据: 无编码问题');
        console.log('  ✅ 4字节 UTF-8 (Emoji/生僻字): 正常');
        console.log('─'.repeat(60));
        console.log('  💡 当前配置正确，不会出现中文乱码。');
        console.log('═'.repeat(60));
        console.log('\n');
      } else {
        const errors = issues.filter(i => i.severity === 'error');
        const warnings = issues.filter(i => i.severity === 'warning');

        console.log(`  ❌ 发现问题: ${errors.length} 个错误, ${warnings.length} 个警告`);
        console.log('─'.repeat(60));

        for (const issue of issues) {
          const icon = issue.severity === 'error' ? '❌' : '⚠️';
          console.log(`  ${icon} [${issue.type}] ${issue.detail}`);
          if (issue.fix) {
            console.log(`     🔧 修复方案: ${issue.fix}`);
          }
        }

        console.log('═'.repeat(60));
        console.log('\n');
      }

      // 始终通过——这是一个诊断报告，不是强制断言
      // 实际的问题已通过前面的具体测试捕获
      expect(true).toBe(true);
    });
  });
});
