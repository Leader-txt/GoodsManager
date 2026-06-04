const pool = require('../config/db');

const logDao = {
  /** 写入系统日志 */
  async insert({ action, operatorId, targetType, targetId, detail }, conn) {
    const db = conn || pool;
    await db.query(
      'INSERT INTO system_log (action, operator_id, target_type, target_id, detail) VALUES (?, ?, ?, ?, ?)',
      [action, operatorId || null, targetType || null, targetId || null, detail ? JSON.stringify(detail) : null]
    );
  },

  /** 分页查询系统日志 */
  async findByPage({ page = 1, pageSize = 20, action, operatorId, targetType, startDate, endDate }, conn) {
    const db = conn || pool;
    const offset = (page - 1) * pageSize;
    let conditions = [];
    let params = [];

    if (action) { conditions.push('sl.action = ?'); params.push(action); }
    if (operatorId) { conditions.push('sl.operator_id = ?'); params.push(operatorId); }
    if (targetType) { conditions.push('sl.target_type = ?'); params.push(targetType); }
    if (startDate) { conditions.push('sl.created_at >= ?'); params.push(startDate); }
    if (endDate) { conditions.push('sl.created_at <= ?'); params.push(endDate + ' 23:59:59'); }

    const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM system_log sl ${whereClause}`, params
    );
    const [rows] = await db.query(
      `SELECT sl.*, u.username as operator_name
       FROM system_log sl LEFT JOIN user u ON sl.operator_id = u.id
       ${whereClause} ORDER BY sl.created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    return { total, list: rows.map(row => ({
      ...row,
      detail: row.detail ? JSON.parse(row.detail) : null,
    }))};
  },
};

module.exports = logDao;
