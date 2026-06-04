const { error } = require('../utils/response');

/**
 * 请求参数校验中间件
 * 提供常用校验规则工厂函数
 */

/** 校验请求体必填字段 */
function required(fields) {
  return (req, res, next) => {
    const missing = fields.filter(f => {
      const val = req.body[f];
      return val === undefined || val === null || val === '';
    });
    if (missing.length > 0) {
      return res.status(400).json(error(400, `缺少必填参数: ${missing.join(', ')}`));
    }
    next();
  };
}

/** 校验查询参数必填字段 */
function requiredQuery(fields) {
  return (req, res, next) => {
    const missing = fields.filter(f => {
      const val = req.query[f];
      return val === undefined || val === null || val === '';
    });
    if (missing.length > 0) {
      return res.status(400).json(error(400, `缺少必填参数: ${missing.join(', ')}`));
    }
    next();
  };
}

/**
 * 校验路由参数中的数字 ID
 * 用法: validateId('id') 或 validateId(['id', 'productId'])
 */
function validateId(fields) {
  const fieldList = Array.isArray(fields) ? fields : [fields];
  return (req, res, next) => {
    for (const field of fieldList) {
      const raw = req.params[field];
      const parsed = parseInt(raw, 10);
      if (isNaN(parsed) || parsed <= 0) {
        return res.status(400).json(error(400, `参数 ${field} 格式错误`));
      }
      // 替换为已解析的安全整数值
      req.params[field] = parsed;
    }
    next();
  };
}

/**
 * 校验路由参数中的订单号 order_no
 * 用法: validateOrderNo('orderNo')
 * 格式: 14位数字 YYYYMMDD + 6位序号
 */
function validateOrderNo(field) {
  return (req, res, next) => {
    const raw = req.params[field];
    if (!raw || !raw.trim()) {
      return res.status(400).json(error(400, `参数 ${field} 不能为空`));
    }
    if (!/^\d{14}$/.test(raw.trim())) {
      return res.status(400).json(error(400, `参数 ${field} 格式错误，需为14位数字订单号`));
    }
    req.params[field] = raw.trim();
    next();
  };
}

module.exports = { required, requiredQuery, validateId, validateOrderNo };
