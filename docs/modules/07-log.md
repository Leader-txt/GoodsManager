# 模块七：系统日志

---

## 1. 模块概述

系统日志模块是一个**横切模块**，贯穿于系统所有关键操作中。它负责记录下单、支付、签收、订单取消、出入库等操作的时间、操作人和详情，为审计追溯和数据核对提供支撑。

> 与其他模块不同，日志模块**没有独立的前端页面**，而是通过其他模块的业务逻辑**自动写入**，并在管理后台中提供查询入口。

### 1.1 涉及角色

| 角色 | 可用功能 |
|------|----------|
| 系统 | 所有关键操作自动写入日志 |
| 管理员 | 在管理后台查看日志 |

### 1.2 涉及数据表

| 表名 | 说明 |
|------|------|
| `system_log` | 系统日志主表 |

---

## 2. 日志记录范围

### 2.1 需记录的操作

| 操作类型 (action) | 触发场景 | 记录时机 |
|:---:|------|------|
| `order_create` | 顾客/销售人员创建订单 | 订单插入数据库后 |
| `order_pay` | 在线支付成功 / 货到付款确认 / 现场结付 | 支付状态更新后 |
| `order_cancel` | 顾客取消订单 / 超时自动取消 | 取消状态更新后 |
| `order_sign` | 顾客确认签收 | 签收状态更新后 |
| `inventory_in` | 仓库操作员执行入库 | 入库完成后 |
| `inventory_out` | 仓库操作员执行出库 / 支付后自动出库 | 出库完成后 |
| `user_register` | 顾客注册（线上线下） | 注册成功后 |

### 2.2 日志字段

| 字段 | 类型 | 说明 |
|------|:----:|------|
| id | INT | 主键自增 |
| action | VARCHAR(50) | 操作类型（见上表） |
| operator_id | INT | 操作人 ID（FK → user.id）；系统自动操作时为 NULL 或特定系统用户 ID |
| target_type | VARCHAR(50) | 操作对象类型：`order` / `inventory` / `user` |
| target_id | INT | 操作对象 ID（如订单 ID、商品 ID） |
| detail | TEXT | JSON 格式详情（状态变更前后值、关键参数等） |
| created_at | DATETIME | 记录创建时间（精确到秒） |

---

## 3. 日志写入规范

### 3.1 日志服务接口

```js
// backend/src/services/log.service.js

/**
 * 写入系统日志
 * @param {Object} params
 * @param {string} params.action      - 操作类型
 * @param {number} params.operatorId  - 操作人 ID
 * @param {string} params.targetType  - 操作对象类型
 * @param {number} params.targetId    - 操作对象 ID
 * @param {Object} params.detail      - 详情对象
 */
async function writeLog({ action, operatorId, targetType, targetId, detail }) {
  return logDao.insert({
    action,
    operatorId,
    targetType,
    targetId,
    detail: JSON.stringify(detail),
  });
}
```

### 3.2 各操作日志详情模板

#### 订单创建 (order_create)

```json
{
  "orderNo": "20240601000001",
  "totalAmount": 8999.00,
  "payMethod": "online",
  "deliveryType": "delivery",
  "channel": "online",
  "items": [
    { "productId": 1, "productName": "联想拯救者R9000P", "quantity": 1, "price": 8999.00 }
  ]
}
```

#### 订单支付 (order_pay)

```json
{
  "orderNo": "20240601000001",
  "payMethod": "online",
  "paidAt": "2024-06-01 10:32:15"
}
```

#### 订单取消 (order_cancel)

```json
{
  "orderNo": "20240601000002",
  "cancelReason": "超时自动取消",
  "cancelledAt": "2024-06-02 10:30:00",
  "restoredItems": [
    { "productId": 1, "productName": "联想拯救者R9000P", "quantity": 1 }
  ]
}
```

#### 订单签收 (order_sign)

```json
{
  "orderNo": "20240601000001",
  "signedAt": "2024-06-03 14:00:00"
}
```

#### 入库 (inventory_in)

```json
{
  "productId": 1,
  "productName": "联想拯救者R9000P",
  "quantity": 20,
  "shelfCode": "1-1-1",
  "beforeQuantity": 0,
  "afterQuantity": 20,
  "remark": "总部供货"
}
```

#### 出库 (inventory_out)

```json
{
  "productId": 1,
  "productName": "联想拯救者R9000P",
  "quantity": 1,
  "shelfCode": "1-1-1",
  "beforeQuantity": 20,
  "afterQuantity": 19,
  "orderId": 15,
  "orderNo": "20240601000001",
  "remark": "销售出库"
}
```

#### 用户注册 (user_register)

```json
{
  "userId": 5,
  "username": "13800138000",
  "role": "customer",
  "registerChannel": "online"
}
```

---

## 4. 日志调用方式

### 4.1 在各 Service 中嵌入调用

日志写入在**业务操作完成后**调用，与业务逻辑在**同一事务中**执行，保证数据一致性。

```js
// 伪代码示例：订单支付
async function payOrder(orderId) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 业务：更新订单状态
    const order = await orderDao.updateStatus(orderId, 'paid', conn);
    // 业务：扣减库存
    await inventoryDao.deduct(order.items, conn);
    // 日志：写入 system_log
    await logDao.insert({
      action: 'order_pay',
      operatorId: req.user.userId,
      targetType: 'order',
      targetId: orderId,
      detail: JSON.stringify({ orderNo: order.orderNo, payMethod: order.payMethod }),
    }, conn);

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
```

### 4.2 直接调用

对于不需要事务的场景，直接调用 `logService.writeLog(...)` 即可。

---

## 5. 日志查询

### 5.1 查询入口

管理员在后台 `/admin/system-log` 页面查看系统日志：

```
┌──────────────────────────────────────────────────────────────┐
│  管理后台 — 系统日志                                          │
├──────────────────────────────────────────────────────────────┤
│  类型：[全部 ▼]  操作人：[全部 ▼]  对象类型：[全部 ▼]          │
│  时间：[起始日期] ~ [截止日期]                                 │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────┬──────────┬──────────┬──────────┬────────────┐  │
│  │ 时间      │ 操作类型  │ 操作人    │ 对象      │ 详情        │  │
│  ├──────────┼──────────┼──────────┼──────────┼────────────┤  │
│  │06-01 10:30│ 下单     │ 张三     │ #001     │ 在线支付... │  │
│  │06-01 10:32│ 支付     │ 张三     │ #001     │ 在线支付    │  │
│  │06-01 14:20│ 出库     │ 张仓库   │ #001     │ 拯救者R9000 │  │
│  │06-01 14:20│ 入库     │ 张仓库   │ -        │ 总部供货 +20│  │
│  │...       │ ...     │ ...     │ ...     │ ...        │  │
│  └──────────┴──────────┴──────────┴──────────┴────────────┘  │
│  分页: < 1 2 3 ... >                                         │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 查询 API

#### GET `/api/admin/system-logs` — 系统日志查询

| 参数 | 类型 | 必填 | 说明 |
|------|:----:|:----:|------|
| page | int | | 页码，默认 1 |
| pageSize | int | | 每页条数，默认 20 |
| action | string | | 操作类型筛选 |
| operatorId | int | | 操作人筛选 |
| targetType | string | | 对象类型筛选 |
| startDate | string | | 起始日期 `YYYY-MM-DD` |
| endDate | string | | 截止日期 `YYYY-MM-DD` |

**响应：**

```json
{
  "code": 200,
  "data": {
    "total": 256,
    "page": 1,
    "pageSize": 20,
    "list": [
      {
        "id": 1,
        "action": "order_create",
        "actionLabel": "下单",
        "operatorId": 3,
        "operatorName": "张三",
        "targetType": "order",
        "targetId": 15,
        "targetLabel": "#20240601000001",
        "detail": { "orderNo": "20240601000001", "totalAmount": 8999.00 },
        "createdAt": "2024-06-01 10:30:00"
      }
    ]
  }
}
```

> `actionLabel` 和 `targetLabel` 在后端映射为可读文本，前端直接展示。

---

## 6. 业务规则

| 编号 | 规则 |
|:----:|------|
| BR-L01 | 日志与业务操作在同一事务中写入，保证一致性——业务失败则日志也不写入 |
| BR-L02 | 日志一旦写入，不可修改或删除（只追加，不 UPDATE/DELETE） |
| BR-L03 | 系统自动操作（如超时取消）的 `operatorId` 设为 `NULL`，`operatorName` 显示为"系统自动" |
| BR-L04 | `detail` 字段存储 JSON，灵活适应不同操作类型的字段差异 |
| BR-L05 | 日志表不设外键（避免删除用户/订单时级联删除日志，日志应独立保留） |

---

## 7. 数据库操作摘要

| 操作 | SQL 类型 | 说明 |
|------|:--------:|------|
| 写日志 | INSERT | system_log，在业务事务中执行 |
| 查询日志 | SELECT + LEFT JOIN | system_log LEFT JOIN user，确保 operator 为 NULL 时也能查出 |

### DAO 层接口

```js
// backend/src/dao/log.dao.js

module.exports = {
  // 写入日志（可选传入事务连接 conn）
  async insert({ action, operatorId, targetType, targetId, detail }, conn) { ... },

  // 分页查询日志（支持多条件筛选）
  async findByPage({ page, pageSize, action, operatorId, targetType, startDate, endDate }) { ... },
};
```

---

## 8. 日志流转全景图

```
  ┌───────────┐     ┌───────────┐     ┌───────────┐
  │ order     │     │ inventory │     │ user      │
  │ service   │     │ service   │     │ service   │
  └─────┬─────┘     └─────┬─────┘     └─────┬─────┘
        │                 │                 │
        │  写日志          │  写日志          │  写日志
        ▼                 ▼                 ▼
  ┌─────────────────────────────────────────────────┐
  │                  log.service                     │
  │                  writeLog()                      │
  └─────────────────────┬───────────────────────────┘
                        │
                        │ INSERT
                        ▼
  ┌─────────────────────────────────────────────────┐
  │               system_log 表                      │
  │  id | action | operator_id | target | detail    │
  └─────────────────────┬───────────────────────────┘
                        │
                        │ SELECT (管理员查询)
                        ▼
  ┌─────────────────────────────────────────────────┐
  │          GET /api/admin/system-logs              │
  │          管理员在后台页面查看                      │
  └─────────────────────────────────────────────────┘
```

---

*所属模块：系统日志 | 对应目录：`backend/src/controllers/log.controller.js`、`backend/src/services/log.service.js`、`backend/src/dao/log.dao.js`*
