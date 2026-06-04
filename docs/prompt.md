# Vibe Coding Prompt — 联想旗舰店商品管理系统

> **使用方式**：将本文档作为 vibe coding 会话的初始 prompt，Agent 将按模块逐步实现整个全栈商品管理系统。
>
> **主 Agent 职责**：跟踪整体进度，按依赖顺序调度子 Agent 实现各模块，确保所有代码通过单元测试。

---

## 1. 项目总览

你需要从零实现一个 **B/S 架构的全栈商品管理系统**，用于联想旗舰店的线上线下双渠道销售。

### 1.1 核心业务

- **双渠道销售**：线上顾客自助下单 + 线下销售人员辅助成交
- **多商品类型**：10 种（笔记本电脑、台式机、平板、智能手机、蓝牙耳机、摄像头、投影仪、电视、键盘、鼠标），使用 EAV 模式适配差异化规格参数
- **完整订单生命周期**：待支付 → 已支付 → 已出库 → 配送中 → 已签收（含 24h 超时自动取消）
- **仓库库存管理**：货架 `A-B-C` 编码体系，出入库全程日志追踪
- **四角色权限**：顾客、销售人员、仓库操作员、管理员，JWT 认证 + 角色中间件

### 1.2 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 (Composition API + SFC)、Vite、Pinia、axios |
| 后端 | Node.js (≥18)、Express、mysql2 |
| 数据库 | MySQL 8.0 (Docker 容器化) |
| 认证 | JWT (jsonwebtoken, 7天有效期)、bcrypt |
| 定时任务 | node-cron |
| 测试 | 前端: Vitest + @vue/test-utils; 后端: Jest 或 Mocha + Chai |

### 1.3 实现约束

- **前后端统一使用 JavaScript**（ES Module 或 CommonJS，各项目自行保持一致）
- **支付方式**：模拟支付（调用接口直接标记已支付，不对接第三方支付）
- **商品图片**：上传到 `backend/uploads/` 目录，Express 静态文件服务
- **商品类型**：10 种全部实现

---

## 2. 项目骨架

### 2.1 当前文件状态

你已有以下设计文档，请先通读（按优先级排序）：

| 优先级 | 文件 | 说明 |
|:------:|------|------|
| ★★★ | `Structure.md` | 系统架构设计（含完整 DDL、目录结构、路由表） |
| ★★★ | `Requirement.md` | 需求规格说明书（业务规则、非功能性需求） |
| ★★ | `docs/modules/01-product.md` | 商品模块详细需求 |
| ★★ | `docs/modules/02-user-auth.md` | 认证模块详细需求 |
| ★★ | `docs/modules/03-cart.md` | 购物车模块详细需求 |
| ★★ | `docs/modules/04-order.md` | 订单模块详细需求 |
| ★★ | `docs/modules/05-inventory.md` | 库存模块详细需求 |
| ★★ | `docs/modules/06-admin.md` | 管理后台模块详细需求 |
| ★★ | `docs/modules/07-log.md` | 系统日志模块详细需求 |

### 2.2 需要从零创建的内容

以下目录和文件**全部需要创建**：

```
GoodsManager/
├── frontend/                        # Vue 3 前端项目
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.js
│       ├── App.vue
│       ├── api/                     # axios 实例 + 各模块 API 封装
│       ├── assets/                  # 静态资源
│       ├── components/              # 公共组件 (layout/product/order/common)
│       ├── router/                  # 14 条路由 + 路由守卫
│       ├── stores/                  # Pinia (auth/cart/product)
│       ├── utils/                   # 校验器、格式化工具
│       └── views/                   # 页面视图 (product/cart/order/user/admin)
├── backend/                         # Node.js + Express 后端
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── server.js                # 入口，启动 Express + 注册 cron
│       ├── app.js                   # Express 应用初始化（中间件、路由挂载）
│       ├── config/                  # 配置 (db.js, index.js)
│       ├── routes/                  # 8 个路由文件 + index.js 汇总
│       ├── middlewares/             # auth.js, role.js, validator.js, errorHandler.js
│       ├── controllers/             # 8 个控制器（请求解析 & 响应组装）
│       ├── services/                # 8 个服务（核心业务逻辑 + 事务管理）
│       ├── dao/                     # 5 个数据访问层（SQL 封装）
│       ├── models/                  # 数据模型定义 (可选)
│       └── utils/                   # jwt.js, password.js, response.js
└── database/                        # 数据库
    ├── init.sql                     # 建库建表 + 预置数据
    ├── seed.sql                     # 测试数据
    └── docker-compose.yml           # MySQL Docker 编排
```

---

## 3. 数据库设计

基于 `Structure.md` 第 5 章，共 **11 张表**。你需要先完成 `database/init.sql`：

| 表名 | 核心字段 | 说明 |
|------|----------|------|
| `user` | id, username, password(bcrypt), role(enum), created_at | 四角色统一存放 |
| `customer` | id, user_id(FK), real_name, gender, id_card, phone, address | 1:1 扩展 user |
| `product` | id, name, category, brand, price, status(on/off), image_url, created_at | 商品主表 |
| `product_spec` | id, product_id(FK), spec_key, spec_value, spec_group | EAV 规格参数 |
| `cart` | id, user_id(FK), product_id(FK), quantity, UK(user_id,product_id) | 购物车 |
| `shelf` | id, shelf_code(UNIQUE, A-B-C), description | 货架 |
| `inventory` | id, product_id(FK, UNIQUE), shelf_id(FK), quantity, updated_at | 库存 |
| `order` | id, order_no(UNIQUE), customer_id, sales_id, total_amount, pay_method, delivery_type, address, express_company, express_no, status(enum), paid_at, created_at, cancelled_at | 订单主表 |
| `order_item` | id, order_id(FK), product_id(FK), quantity, price(快照) | 订单明细 |
| `inventory_log` | id, type(in/out), product_id, product_name, product_model, quantity, operator_id, order_id, remark, created_at | 出入库日志 |
| `system_log` | id, action, operator_id, target_type, target_id, detail(JSON), created_at | 系统操作日志 |

**预置数据要求**：
- 管理员：`admin` / `admin123`
- 仓库操作员：`warehouse01` / `abc123`
- 销售人员：`sales01` / `abc123`
- 每种商品类型至少 2 条示例商品数据（含规格参数）
- 货架至少 10 个
- 库存初始数据（每种商品 10-50 件）

---

## 4. 架构约束与约定

### 4.1 后端分层调用

```
routes → middlewares → controllers → services → dao → MySQL
```

**规则**：严格单向调用，禁止下层调用上层，禁止跨层调用。

- **Controller**：只做参数提取和响应组装，不写业务逻辑
- **Service**：核心业务逻辑、流程编排、事务管理
- **DAO**：纯 SQL 封装，返回原始数据行
- **事务**：在 Service 层通过 `connection.beginTransaction()` / `commit()` / `rollback()` 管理

### 4.2 统一响应格式

```json
{ "code": 200, "message": "ok", "data": {} }
```

状态码：200 成功 | 400 参数错误 | 401 未登录 | 403 权限不足 | 404 资源不存在 | 500 服务器错误

### 4.3 中间件

| 中间件 | 说明 |
|--------|------|
| `auth.js` | 解析 `Authorization: Bearer <token>`，注入 `req.user = { userId, username, role }`，失败返回 401 |
| `role.js` | 工厂函数 `role(['admin', 'sales'])` 返回中间件，比对 `req.user.role`，不匹配返回 403 |
| `validator.js` | 使用 `express-validator` 或 Joi 校验请求参数 |
| `errorHandler.js` | 全局 try-catch，统一错误响应，不泄露敏感信息 |

### 4.4 前端约定

- **路由守卫**：`router.beforeEach` 检查 Pinia auth store 中的 token，未登录跳转 `/login`
- **权限控制**：导航栏根据 `user.role` 显示不同菜单入口
- **axios 拦截器**：请求拦截器注入 Token；响应拦截器处理 401 自动跳登录
- **组件拆分**：每个页面视图控制在 300 行以内，抽取公共组件

---

## 5. 模块实现规格

按**依赖顺序**实现，每个模块由**独立子 Agent** 完成前后端代码和单元测试。

---

### 阶段 0：基础设施 (Infrastructure)

**负责 Agent**：主 Agent 或独立子 Agent

**任务清单**：

| 序号 | 任务 | 产出物 |
|:----:|------|--------|
| 0.1 | 创建前端脚手架 | `frontend/package.json`, `vite.config.js`, `index.html`, `src/main.js`, `src/App.vue` |
| 0.2 | 创建 axios 实例 | `src/api/index.js`（baseURL、请求/响应拦截器） |
| 0.3 | 创建路由框架 | `src/router/index.js`（14 条路由占位 + beforeEach 守卫） |
| 0.4 | 创建 Pinia stores | `src/stores/auth.js`, `src/stores/cart.js`, `src/stores/product.js` |
| 0.5 | 创建通用组件 | `Pagination.vue`, `ConfirmDialog.vue`, 布局组件 `AppHeader.vue` |
| 0.6 | 创建工具函数 | `src/utils/validators.js`, `src/utils/format.js` |
| 0.7 | 创建后端脚手架 | `backend/package.json`, `src/server.js`, `src/app.js` |
| 0.8 | 创建配置层 | `src/config/index.js`, `src/config/db.js`（mysql2 连接池） |
| 0.9 | 创建中间件 | `auth.js`, `role.js`, `validator.js`, `errorHandler.js` |
| 0.10 | 创建工具函数 | `src/utils/jwt.js`, `src/utils/password.js`, `src/utils/response.js` |
| 0.11 | 创建数据库文件 | `database/init.sql`, `database/seed.sql`, `database/docker-compose.yml` |
| 0.12 | 创建 .env.example | JWT_SECRET, DB 连接参数等 |

**验收标准**：
- 前后端项目可成功 `npm install && npm run dev` 启动
- Docker Compose 可成功启动 MySQL 并执行 init.sql 建表
- 后端 `/api/health` 端点返回 `{ code: 200, message: "ok" }`
- 前端可访问 `http://localhost:5173` 看到空白首页

---

### 阶段 1：用户认证与个人信息 (Module 02)

**依赖**：阶段 0

**负责 Agent**：子 Agent

**功能需求**（详见 `docs/modules/02-user-auth.md`）：

| 编号 | 功能 | API |
|:----:|------|-----|
| U-01 | 线上注册 | `POST /api/auth/register` |
| U-04 | 账号登录 | `POST /api/auth/login` |
| U-09 | 查看个人信息 | `GET /api/users/profile` |
| U-10 | 修改手机号 | `PUT /api/users/phone` |
| U-11 | 修改收货地址 | `PUT /api/users/address` |
| U-13 | 线下注册 | `POST /api/users/offline-register` (sales角色) |

**后端产出**：
- `auth.routes.js` + `auth.controller.js` + `auth.service.js`
- `user.routes.js` + `user.controller.js` + `user.service.js` + `user.dao.js`

**前端产出**：
- `Login.vue`（登录表单）
- `Register.vue`（注册表单 + 前端校验：手机号格式、密码6-20位、姓名2-20中文、身份证18位）
- `Profile.vue`（个人信息展示，不可改字段置灰）
- `api/auth.js` + `api/user.js`

**关键业务规则**：
- 密码 bcrypt 加密后存储
- 用户名和身份证号唯一性校验
- 姓名、性别、身份证号注册后不可修改
- JWT 过期 7 天
- 线下注册：为用户自动生成用户名和初始密码（身份证号后 6 位）

**测试要求**：
- 后端：注册成功/重复注册/登录成功/登录失败/Token无效/个人信息查询
- 前端：表单校验规则测试、注册/登录组件渲染测试

---

### 阶段 2：商品浏览与管理 (Module 01)

**依赖**：阶段 0、阶段 1（需要 JWT 认证中间件）

**负责 Agent**：子 Agent

**功能需求**（详见 `docs/modules/01-product.md`）：

| 编号 | 功能 | API |
|:----:|------|-----|
| P-01| 商品列表（分页+筛选） | `GET /api/products` |
| P-08| 商品详情（含规格参数） | `GET /api/products/:id` |
| P-12| 添加商品（管理员） | `POST /api/admin/products` |
| P-14| 编辑商品（管理员） | `PUT /api/admin/products/:id` |
| P-15| 上架/下架（管理员） | `PATCH /api/admin/products/:id/status` |
| — | 删除商品（管理员） | `DELETE /api/admin/products/:id` |

**后端产出**：
- `product.routes.js` + `product.controller.js` + `product.service.js` + `product.dao.js`

**前端产出**：
- `ProductList.vue`（搜索、类型筛选、品牌筛选、排序、分页、缺货遮罩）
- `ProductDetail.vue`（规格参数分组展示、加入购物车、库存状态）
- `ProductManage.vue`（管理员表格视图 + 添加/编辑商品表单 + 动态规格参数编辑）
- `ProductCard.vue`, `SpecTable.vue` 公共组件
- `api/product.js`

**关键业务规则**：
- 下架商品不在前台展示
- 库存为 0 的商品显示"暂时缺货"，购买按钮禁用
- 规格参数按 `spec_group` 分组展示
- 删除商品前检查关联的未完成订单
- `order_item.price` 存储下单时快照，商品调价不影响已有订单
- 10 种商品类型配置统一管理

**测试要求**：
- 后端：商品列表查询（分页/筛选/排序）、详情查询、管理员 CRUD、上架/下架
- 前端：ProductCard 组件渲染、ProductList 筛选交互、缺货状态显示

---

### 阶段 3：购物车 (Module 03)

**依赖**：阶段 0、阶段 1、阶段 2（需要商品数据）

**负责 Agent**：子 Agent

**功能需求**（详见 `docs/modules/03-cart.md`）：

| 编号 | 功能 | API |
|:----:|------|-----|
| C-01| 获取购物车列表 | `GET /api/cart` |
| C-10| 加入购物车 | `POST /api/cart` |
| C-02| 修改数量 | `PUT /api/cart/:id` |
| C-03| 删除购物车项 | `DELETE /api/cart/:id` |
| C-04| 选中/取消 | 前端 Pinia 管理 |
| — | 清空已选（结算后） | `DELETE /api/cart` |

**后端产出**：
- `cart.routes.js` + `cart.controller.js` + `cart.service.js` + ... (可复用 product.dao)

**前端产出**：
- `CartView.vue`（全选、数量调整、删除、金额计算、空状态、库存不足提示）
- 更新 Pinia `cart.js` store（角标数量）
- 导航栏购物车图标 + 角标
- `api/cart.js`

**关键业务规则**：
- 仅顾客可用购物车
- 加入时校验库存，数量不得超库存
- 同一商品多次加入时合并数量（利用 UNIQUE KEY）
- 进入结算前再次校验库存

**测试要求**：
- 后端：加入购物车/重复加入合并/修改数量/删除/库存校验
- 前端：CartView 组件渲染、全选/取消全选、数量调整、金额计算

---

### 阶段 4：订单管理 (Module 04)

**依赖**：阶段 0、阶段 1、阶段 2、阶段 3

**负责 Agent**：子 Agent

**功能需求**（详见 `docs/modules/04-order.md`）：

| 编号 | 功能 | API |
|:----:|------|-----|
| O-06| 提交订单（线上） | `POST /api/orders` |
| — | 在线支付（模拟） | `PUT /api/orders/:id/pay` |
| O-11| 取消订单 | `PUT /api/orders/:id/cancel` |
| O-12| 确认签收 | `PUT /api/orders/:id/sign` |
| O-07| 我的订单列表 | `GET /api/orders` |
| O-13| 订单详情 | `GET /api/orders/:id` |
| O-18| 创建线下订单 | `POST /api/orders/offline` (sales角色) |
| — | 定时取消任务 | node-cron 每 5 分钟 |

**后端产出**：
- `order.routes.js` + `order.controller.js` + `order.service.js` + `order.dao.js`
- 定时任务注册在 `server.js`

**前端产出**：
- `Checkout.vue`（结算页：商品确认、地址选择、支付/提货方式、最终库存校验）
- `OrderList.vue`（状态筛选标签、倒计时显示、操作按钮）
- `OrderDetail.vue`（状态时间线、商品明细、物流信息）
- `OrderStatusTag.vue`, `LogisticsInfo.vue` 组件
- `api/order.js`

**订单状态流转**：
```
pending → paid → shipped → delivering → signed
pending → cancelled (超时 24h / 手动取消)
货到付款/现场结付：pending → paid (跳过在线等待)
自提：paid → signed (跳过配送)
```

**关键业务规则**：
- 订单号规则：`YYYYMMDD` + 6 位自增序号
- 下单时再次校验库存
- 在线支付 24h 超时自动取消 + 库存回退
- 货到付款/现场结付创建后直接标记 paid
- 线下自提直接完成（paid → signed）
- 每次状态变更写入 system_log

**测试要求**：
- 后端：提交订单/库存不足拒绝/支付/取消回退库存/超时取消/签收/订单列表
- 前端：Checkout 结算流程、OrderList 状态筛选、倒计时组件

---

### 阶段 5：库存管理 (Module 05)

**依赖**：阶段 0、阶段 1、阶段 4（需要订单数据关联出库）

**负责 Agent**：子 Agent

**功能需求**（详见 `docs/modules/05-inventory.md`）：

| 编号 | 功能 | API |
|:----:|------|-----|
| I-01| 货架列表 | `GET /api/shelves` |
| I-02| 添加货架 | `POST /api/shelves` |
| I-04| 删除货架 | `DELETE /api/shelves/:id` |
| I-06| 库存列表 | `GET /api/inventory` |
| I-11| 库存详情+出入库历史 | `GET /api/inventory/:productId` |
| I-15| 入库 | `POST /api/inventory/stock-in` |
| I-18| 出库 | `POST /api/inventory/stock-out` |
| — | 批量出库 | `POST /api/inventory/stock-out-batch` |

**后端产出**：
- `inventory.routes.js` + `inventory.controller.js` + `inventory.service.js` + `inventory.dao.js`

**前端产出**：
- 货架管理页（表格 + 增删弹窗）
- 库存总览页（搜索、类型筛选、库存状态筛选、低库存预警高亮）
- 入库/出库操作弹窗
- `api/inventory.js`

**关键业务规则**：
- 货架编号格式 `A-B-C`（每段 1-99），全局唯一
- 删除货架前校验：无关联库存记录
- 出库数量 ≤ 当前库存
- **支付成功后自动扣减库存**（在 order service 中调用 inventory service）
- 入库/出库均写入 `inventory_log` + `system_log`

**测试要求**：
- 后端：货架 CRUD/货架编号校验/入库/出库/库存不足拒绝/库存查询
- 前端：库存列表渲染、库存预警高亮、入库出库表单校验

---

### 阶段 6：管理后台 (Module 06)

**依赖**：阶段 0、阶段 1、阶段 4、阶段 5

**负责 Agent**：子 Agent

**功能需求**（详见 `docs/modules/06-admin.md`）：

| 编号 | 功能 | API |
|:----:|------|-----|
| A-01| 仪表盘 | `GET /api/admin/dashboard` |
| A-04| 销售人员列表 | `GET /api/admin/sales` |
| A-05| 添加销售人员 | `POST /api/admin/sales` |
| A-06| 删除销售人员 | `DELETE /api/admin/sales/:id` |
| A-07| 重置密码 | `POST /api/admin/sales/:id/reset-password` |
| A-08| 全部订单查看 | `GET /api/admin/orders` |
| A-12| 出入库日志查看 | `GET /api/admin/inventory-logs` |

**后端产出**：
- `admin.routes.js` + `admin.controller.js` + `admin.service.js` + `admin.dao.js`

**前端产出**：
- `Dashboard.vue`（4 张统计卡片 + 最近订单/出入库列表）
- `SalesManage.vue`（销售人员表格 + 添加/删除/重置密码弹窗）
- `OrderManage.vue`（全局订单表格 + 搜索筛选）
- `InventoryLog.vue`（出入库日志表格 + 类型/操作员/时间筛选）
- `api/admin.js`

**关键业务规则**：
- 管理员账号仅通过数据库初始化创建
- 删除销售人员前校验未完成订单
- 管理员只读查看，不修改订单状态
- 密码重置后仅返回一次新密码

**测试要求**：
- 后端：仪表盘统计/销售人员 CRUD/订单查看/日志查看
- 前端：Dashboard 统计卡片渲染、SalesManage 表单交互

---

### 阶段 7：系统日志 (Module 07)

**依赖**：阶段 0（贯穿所有业务模块）

**负责 Agent**：子 Agent

**功能需求**（详见 `docs/modules/07-log.md`）：

日志模块是**横切关注点**，嵌入在其他模块的业务逻辑中：

| 操作类型 | 触发场景 | 写入模块 |
|:---:|------|------|
| `order_create` | 订单创建 | 04-order |
| `order_pay` | 支付完成 | 04-order |
| `order_cancel` | 取消订单 | 04-order |
| `order_sign` | 确认签收 | 04-order |
| `inventory_in` | 入库 | 05-inventory |
| `inventory_out` | 出库 | 05-inventory |
| `user_register` | 用户注册 | 02-auth |

**管理后台日志查询**：`GET /api/admin/system-logs`（已在阶段 6 中实现查询页面）

**后端产出**：
- `log.service.js` + `log.dao.js` + `log.controller.js` + `log.routes.js`

**关键业务规则**：
- 日志与业务在同一事务中写入
- 日志只追加（Append-Only），不修改不删除
- 系统自动操作的 `operatorId` 为 NULL
- `detail` 存 JSON，适配不同操作类型

**测试要求**：
- 后端：日志写入/日志查询（按类型/时间/操作人筛选）

---

## 6. 单元测试要求

### 6.1 后端测试

- **框架**：Jest 或 Mocha + Chai
- **数据库**：使用独立测试数据库或 SQLite 内存模式，测试前后自动建表/清理
- **覆盖率**：每个 service 和 dao 方法至少 2 个测试用例（正常+异常）
- **Mock**：JWT 中间件可用 supertest 发送带 Token 的请求进行集成测试

每个模块的 service 至少测试：
- 正常业务流程
- 参数校验失败
- 权限校验失败
- 事务回滚场景

### 6.2 前端测试

- **框架**：Vitest + @vue/test-utils
- 每个页面组件至少测试：渲染、关键交互、边界状态（loading/empty/error）
- 表单组件测试校验规则
- Pinia store 测试 action 和 getter

### 6.3 测试文件命名

```
backend/tests/{module}.test.js        # 如: backend/tests/auth.test.js
frontend/src/**/__tests__/*.test.js   # 如: frontend/src/views/product/__tests__/ProductList.test.js
```

---

## 7. 实现顺序总结

```
阶段 0: 基础设施 (Database + Scaffold)
   │
   ├──► 阶段 1: 用户认证与个人信息 (02-auth)
   │       │
   │       ▼
   ├──► 阶段 2: 商品浏览与管理 (01-product)
   │       │
   │       ▼
   ├──► 阶段 3: 购物车 (03-cart)
   │       │
   │       ▼
   ├──► 阶段 4: 订单管理 (04-order) ───► 定时任务 (超时取消)
   │       │
   │       ▼
   ├──► 阶段 5: 库存管理 (05-inventory)
   │       │
   │       ▼
   ├──► 阶段 6: 管理后台 (06-admin)
   │
   └──► 阶段 7: 系统日志 (07-log) [贯穿所有阶段, 在各模块中嵌入调用]
```

---

## 8. 启动命令参考

```bash
# 1. 启动数据库
cd database && docker-compose up -d

# 2. 启动后端
cd backend && cp .env.example .env && npm install && npm run dev

# 3. 启动前端
cd frontend && npm install && npm run dev

# 4. 运行测试
cd backend && npm test
cd frontend && npm test
```

---

## 9. 主 Agent 执行规则

1. **按阶段顺序**调用子 Agent，每个阶段完成后运行测试，确认通过再进入下一阶段
2. 每个子 Agent 接收对应的模块文档作为输入，产出前后端代码 + 测试
3. 子 Agent 之间通过**共享的数据库 schema** 和 **API 契约** 解耦——后续模块通过 API 接口调用前置模块，而非直接操作其数据库表
4. **日志模块**跨越多个阶段：各业务模块实现时预留 `log.service.writeLog()` 调用点
5. 遇到任何实现上的歧义，子 Agent 应回传问题给主 Agent 决策
6. 每个阶段完成后**必须**运行测试并全部通过，才能进入下一阶段

---

*Prompt 版本：v1.0 | 生成日期：2026-06-03*
