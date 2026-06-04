# 联想旗舰店商品管理系统

> B/S 架构的全栈商品管理系统，支持线上线下双渠道销售、库存管理、顾客管理。

---

## 项目简介

本项目为联想旗舰店打造一套统一的商品管理系统，覆盖**商品浏览、购物车、订单交易、库存管理、顾客管理、系统日志**六大核心业务。系统采用前后端分离架构，前端使用 Vue 3 构建 SPA，后端使用 Node.js + Express 提供 RESTful API，数据持久化于 MySQL。

### 核心特性

- **双渠道销售** — 线上顾客自助下单 + 线下销售人员辅助成交
- **多商品类型** — 10 种商品类型（笔记本电脑、台式机、平板、智能手机、蓝牙耳机、摄像头、投影仪、电视、键盘、鼠标），EAV 模式灵活适配差异化规格参数
- **完整订单生命周期** — 待支付 → 已支付 → 已出库 → 配送中 → 已签收，支持超时自动取消
- **仓库库存管理** — 货架 `A-B-C` 编码体系，出入库全程日志追踪
- **四角色权限** — 顾客、销售人员、仓库操作员、管理员，JWT 认证 + 角色中间件

---

## 技术栈

| 层级 | 技术 | 版本 / 说明 |
|------|------|:----------:|
| 前端框架 | **Vue 3** | Composition API + SFC |
| 构建工具 | **Vite** | 开发服务器 & 打包 |
| 状态管理 | **Pinia** | 轻量级响应式状态 |
| HTTP 客户端 | **axios** | 请求拦截 & JWT 注入 |
| 后端运行时 | **Node.js** | ≥ 18 LTS |
| 后端框架 | **Express** | RESTful API |
| 数据库 | **MySQL** | 8.0 (Docker 容器化) |
| 认证 | **JWT** (jsonwebtoken) | 7 天有效期 |
| 密码加密 | **bcrypt** | 哈希存储 |
| 定时任务 | **node-cron** | 超时订单扫描 |

---

## 项目结构

```
GoodsManager/
├── README.md
├── Requirement.md                   # 需求规格说明书
├── Structure.md                     # 系统架构设计（含完整 DDL）
├── todoList.md                      # 任务清单与进度
├── docs/
│   ├── prompt.md                    # Vibe Coding Prompt（主 Agent 调度指南）
│   └── modules/                     # 模块需求文档
│       ├── 01-product.md
│       ├── 02-user-auth.md
│       ├── 03-cart.md
│       ├── 04-order.md
│       ├── 05-inventory.md
│       ├── 06-admin.md
│       └── 07-log.md
├── frontend/                        # Vue 3 前端 (39 个源文件)
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.js                  # 入口：注册 Pinia + Router
│       ├── App.vue                  # 根组件 + AppHeader + <router-view>
│       ├── api/                     # axios 实例 + 8 个 API 模块
│       │   ├── index.js             # 拦截器（注入 Token / 401 跳转）
│       │   ├── auth.js, user.js, product.js, cart.js
│       │   ├── order.js, inventory.js, admin.js
│       ├── components/
│       │   ├── layout/AppHeader.vue # 导航栏 + 角色菜单 + 购物车角标
│       │   ├── common/Pagination.vue, ConfirmDialog.vue
│       │   ├── product/ProductCard.vue, SpecTable.vue
│       │   └── order/OrderStatusTag.vue, LogisticsInfo.vue
│       ├── router/index.js          # 16 条路由 + beforeEach 守卫
│       ├── stores/                  # Pinia (auth / cart / product)
│       ├── utils/                   # validators.js / format.js
│       └── views/                   # 16 个页面视图
│           ├── HomeView.vue
│           ├── product/ (ProductList, ProductDetail)
│           ├── cart/ (CartView)
│           ├── order/ (Checkout, OrderList, OrderDetail)
│           ├── user/ (Login, Register, Profile)
│           └── admin/ (Dashboard, SalesManage, ProductManage, OrderManage, InventoryLog, SystemLog)
├── backend/                         # Node.js + Express 后端 (40 个源文件)
│   ├── package.json
│   ├── .env / .env.example
│   └── src/
│       ├── server.js                # 启动入口 + node-cron 定时任务
│       ├── app.js                   # Express 初始化（cors/json/static/routes/errorHandler）
│       ├── config/ (index.js, db.js)
│       ├── routes/ (index.js + 6 个模块路由)
│       ├── middlewares/ (auth.js, role.js, validator.js, errorHandler.js)
│       ├── controllers/ (8 个控制器)
│       ├── services/ (8 个服务层)
│       ├── dao/ (6 个数据访问层)
│       └── utils/ (jwt.js, password.js, response.js)
└── database/
    ├── docker-compose.yml           # MySQL 8.0 编排
    ├── init.sql                     # 11 张表 DDL + 4 个预置账号 + 20 个种子商品
    └── seed.sql                     # 额外测试数据
```

---

## 快速开始

### 前置要求

- **Node.js** ≥ 18
- **Docker** & **Docker Compose**（用于运行 MySQL）

### 1. 启动 MySQL

```bash
cd database
docker-compose up -d
```

MySQL 8.0 在 `localhost:3306` 启动，自动创建 `goods_manager` 库并执行 `init.sql`（建表 + 种子数据）。

### 2. 启动后端

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

后端运行在 `http://localhost:3000`，健康检查：`http://localhost:3000/api/health`

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端运行在 `http://localhost:5173`，已配置 `/api` 代理到后端 3000 端口。

### 4. 运行测试

```bash
# 后端测试
cd backend && npm test

# 前端测试
cd frontend && npm test

# 前端构建
cd frontend && npm run build
```

---

## 预置账号

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 管理员 | `admin` | `admin123` | 可访问管理后台 `/admin/dashboard` |
| 仓库操作员 | `warehouse01` | `abc123` | 出入库操作 |
| 销售人员 | `sales01` | `abc123` | 线下注册顾客、创建线下订单 |
| 顾客 | `customer01` | `abc123` | 浏览商品、下单、购物车 |

> 也可通过 `/register` 自行注册新顾客账号。

---

## API 概览

### 公开接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/health` | 健康检查 |
| `POST` | `/api/auth/register` | 顾客注册 |
| `POST` | `/api/auth/login` | 用户登录 |
| `GET` | `/api/products` | 商品列表（分页+筛选+排序） |
| `GET` | `/api/products/:id` | 商品详情（含规格参数） |

### 需认证接口

| 方法 | 路径 | 角色 | 说明 |
|------|------|:--:|------|
| `GET` | `/api/users/profile` | 任意 | 个人信息 |
| `PUT` | `/api/users/phone` | 任意 | 修改手机号 |
| `PUT` | `/api/users/address` | 任意 | 修改收货地址 |
| `POST` | `/api/users/offline-register` | sales | 线下注册顾客 |
| `GET/POST` | `/api/cart` | customer | 购物车列表/加入 |
| `PUT/DELETE` | `/api/cart/:id` | customer | 修改数量/删除 |
| `POST` | `/api/orders` | customer | 提交订单 |
| `GET` | `/api/orders` | 任意 | 我的订单 |
| `GET` | `/api/orders/:id` | 任意 | 订单详情 |
| `PUT` | `/api/orders/:id/pay` | customer | 模拟支付 |
| `PUT` | `/api/orders/:id/cancel` | customer | 取消订单 |
| `PUT` | `/api/orders/:id/sign` | 任意 | 确认签收 |
| `POST` | `/api/orders/offline` | sales | 创建线下订单 |
| `GET/POST` | `/api/shelves` | warehouse | 货架管理 |
| `GET` | `/api/inventory` | 任意 | 库存列表 |
| `POST` | `/api/stock-in` | warehouse | 入库 |
| `POST` | `/api/stock-out` | warehouse | 出库 |

### 管理员接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/admin/dashboard` | 仪表盘统计 |
| `GET/POST` | `/api/admin/sales` | 销售人员列表/添加 |
| `DELETE` | `/api/admin/sales/:id` | 删除销售人员 |
| `POST` | `/api/admin/sales/:id/reset-password` | 重置密码 |
| `GET/POST/PUT/PATCH/DELETE` | `/api/admin/products` | 商品 CRUD |
| `GET` | `/api/admin/orders` | 全部订单 |
| `GET` | `/api/admin/inventory-logs` | 出入库日志 |
| `GET` | `/api/admin/system-logs` | 系统日志 |

---

## 数据库

共 11 张表：`user`、`customer`、`product`、`product_spec`、`cart`、`shelf`、`inventory`、`order`、`order_item`、`inventory_log`、`system_log`。

**种子数据**：10 种商品类型各至少 2 个商品（含 EAV 规格参数），每种商品初始库存 10-50 件，13 个预设货架。

---

## 模块文档入口

| 编号 | 文档 | 核心职责 |
|:----:|------|------|
| 01 | [商品浏览与管理](docs/modules/01-product.md) | 商品列表/详情、规格参数、管理员商品维护 |
| 02 | [用户认证与个人信息](docs/modules/02-user-auth.md) | 注册/登录、JWT、线下顾客注册、信息修改 |
| 03 | [购物车](docs/modules/03-cart.md) | 购物车增删改、库存校验、结算入口 |
| 04 | [订单管理](docs/modules/04-order.md) | 线上/线下订单、支付、物流、超时取消 |
| 05 | [库存管理](docs/modules/05-inventory.md) | 货架管理、出入库、库存预警 |
| 06 | [管理后台](docs/modules/06-admin.md) | 仪表盘、销售人员管理、全局数据查看 |
| 07 | [系统日志](docs/modules/07-log.md) | 操作日志写入规范、查询接口 |

### 架构文档

- [Requirement.md](Requirement.md) — 完整需求规格说明书
- [Structure.md](Structure.md) — 系统架构设计（拓扑、分层、数据库 ER、DDL、部署）

---

## 架构约定

### 后端分层

```
routes → middlewares → controllers → services → dao → MySQL
```

严格单向调用，禁止下层调用上层或跨层调用。Controller 只做参数提取和响应组装；Service 编写核心业务逻辑和管理事务。

### 统一响应格式

```json
{ "code": 200, "message": "ok", "data": {} }
```

| code | 含义 |
|:----:|------|
| 200 | 成功 |
| 400 | 参数错误 |
| 401 | 未登录 / Token 过期 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

---

*项目版本：v1.0 | 最后更新：2026-06-03*
