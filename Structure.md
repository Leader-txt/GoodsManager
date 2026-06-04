# 联想旗舰店商品管理系统 — 系统架构设计

---

## 1. 整体架构拓扑

```
┌─────────────────────────────────────────────────────────────────┐
│                         客户端 (Browser)                         │
│                    Vue 3 SPA  (Port: 5173)                       │
└─────────────┬──────────────────────────────────┬────────────────┘
              │                                  │
              │  RESTful API (JSON)              │  静态资源请求
              │  axios + JWT Token               │
              ▼                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Nginx 反向代理 (可选)                          │
│                     Port: 80 / 443                               │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │  代理转发
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Node.js 服务端 (Port: 3000)                    │
│                   Express / Koa 框架                              │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────────┐  │
│  │ 路由层   │ 中间件层  │ 控制器层  │ 服务层   │ 数据访问层   │  │
│  │ Routes  │Middleware│Controller│ Service  │   DAO        │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────────┘  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │  mysql2 连接池
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  MySQL 8.0  (Docker Container)                   │
│                     Port: 3306                                   │
│              Database: goods_manager                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 项目目录结构

```
GoodsManager/
├── frontend/                        # 前端项目 (Vue 3)
│   ├── public/
│   ├── src/
│   │   ├── api/                     # API 请求封装
│   │   │   ├── index.js             # axios 实例 + 拦截器
│   │   │   ├── auth.js              # 登录/注册 API
│   │   │   ├── product.js           # 商品相关 API
│   │   │   ├── order.js             # 订单相关 API
│   │   │   ├── cart.js              # 购物车 API
│   │   │   ├── user.js              # 用户信息 API
│   │   │   ├── inventory.js         # 库存 API
│   │   │   ├── admin.js             # 管理员 API
│   │   │   └── log.js               # 日志 API
│   │   ├── assets/                  # 静态资源 (图片、样式)
│   │   ├── components/              # 公共组件
│   │   │   ├── layout/              # 布局组件
│   │   │   │   ├── AppHeader.vue
│   │   │   │   ├── AppSidebar.vue
│   │   │   │   └── AppFooter.vue
│   │   │   ├── product/             # 商品相关组件
│   │   │   │   ├── ProductCard.vue       # 商品卡片
│   │   │   │   └── SpecTable.vue         # 规格参数表
│   │   │   ├── order/               # 订单相关组件
│   │   │   │   ├── OrderStatusTag.vue    # 订单状态标签
│   │   │   │   └── LogisticsInfo.vue     # 物流信息展示
│   │   │   └── common/              # 通用组件
│   │   │       ├── Pagination.vue
│   │   │       └── ConfirmDialog.vue
│   │   ├── router/                  # 路由配置
│   │   │   └── index.js
│   │   ├── stores/                  # Pinia 状态管理
│   │   │   ├── auth.js              # 用户登录状态
│   │   │   ├── cart.js              # 购物车状态
│   │   │   └── product.js           # 商品浏览状态
│   │   ├── utils/                   # 工具函数
│   │   │   ├── validators.js        # 表单校验
│   │   │   └── format.js            # 数据格式化
│   │   ├── views/                   # 页面视图
│   │   │   ├── HomeView.vue         # 首页
│   │   │   ├── product/             # 商品模块
│   │   │   │   ├── ProductList.vue       # 商品列表
│   │   │   │   └── ProductDetail.vue     # 商品详情
│   │   │   ├── cart/                # 购物车模块
│   │   │   │   └── CartView.vue
│   │   │   ├── order/               # 订单模块
│   │   │   │   ├── OrderList.vue         # 订单列表
│   │   │   │   ├── OrderDetail.vue       # 订单详情
│   │   │   │   └── Checkout.vue          # 结算下单
│   │   │   ├── user/                # 用户模块
│   │   │   │   ├── Login.vue             # 登录
│   │   │   │   ├── Register.vue          # 注册
│   │   │   │   └── Profile.vue           # 个人信息
│   │   │   └── admin/               # 管理后台模块
│   │   │       ├── Dashboard.vue         # 管理首页
│   │   │       ├── SalesManage.vue       # 销售人员管理
│   │   │       ├── ProductManage.vue     # 商品管理
│   │   │       ├── OrderManage.vue       # 订单查看
│   │   │       └── InventoryLog.vue      # 出入库日志
│   │   ├── App.vue                  # 根组件
│   │   └── main.js                  # 入口文件
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                         # 后端项目 (Node.js)
│   ├── src/
│   │   ├── app.js                   # Express 应用初始化
│   │   ├── server.js                # 服务启动入口
│   │   ├── config/                  # 配置文件
│   │   │   ├── index.js             # 配置入口 (读取 .env)
│   │   │   └── db.js                # 数据库连接池配置
│   │   ├── routes/                  # 路由层 — 定义 URL 与控制器映射
│   │   │   ├── index.js             # 路由汇总
│   │   │   ├── auth.routes.js       # /api/auth/*
│   │   │   ├── product.routes.js    # /api/products/*
│   │   │   ├── order.routes.js      # /api/orders/*
│   │   │   ├── cart.routes.js       # /api/cart/*
│   │   │   ├── user.routes.js       # /api/users/*
│   │   │   ├── inventory.routes.js  # /api/inventory/*
│   │   │   ├── admin.routes.js      # /api/admin/*
│   │   │   └── log.routes.js        # /api/logs/*
│   │   ├── middlewares/             # 中间件层 — 请求拦截处理
│   │   │   ├── auth.js              # JWT 认证中间件
│   │   │   ├── role.js              # 角色权限校验
│   │   │   ├── validator.js         # 请求参数校验
│   │   │   └── errorHandler.js      # 全局错误处理
│   │   ├── controllers/             # 控制器层 — 处理请求/响应
│   │   │   ├── auth.controller.js
│   │   │   ├── product.controller.js
│   │   │   ├── order.controller.js
│   │   │   ├── cart.controller.js
│   │   │   ├── user.controller.js
│   │   │   ├── inventory.controller.js
│   │   │   ├── admin.controller.js
│   │   │   └── log.controller.js
│   │   ├── services/                # 服务层 — 核心业务逻辑
│   │   │   ├── auth.service.js
│   │   │   ├── product.service.js
│   │   │   ├── order.service.js
│   │   │   ├── cart.service.js
│   │   │   ├── user.service.js
│   │   │   ├── inventory.service.js
│   │   │   ├── admin.service.js
│   │   │   └── log.service.js
│   │   ├── dao/                     # 数据访问层 — SQL 操作封装
│   │   │   ├── user.dao.js
│   │   │   ├── product.dao.js
│   │   │   ├── order.dao.js
│   │   │   ├── inventory.dao.js
│   │   │   └── log.dao.js
│   │   ├── models/                  # 数据模型定义 (可选，JSDoc 注释)
│   │   │   └── index.js
│   │   └── utils/                   # 工具函数
│   │       ├── jwt.js               # JWT 签发与验证
│   │       ├── password.js          # 密码加密 (bcrypt)
│   │       └── response.js          # 统一响应格式
│   ├── .env                         # 环境变量 (不提交)
│   ├── .env.example                 # 环境变量模板
│   └── package.json
│
├── database/                        # 数据库相关
│   ├── init.sql                     # 建库建表 SQL
│   ├── seed.sql                     # 测试数据填充
│   └── docker-compose.yml           # MySQL Docker 编排
│
├── docs/                            # 文档
│   ├── Requirement.md
│   └── Structure.md
│
└── README.md
```

---

## 3. 前端架构

### 3.1 路由设计

| 路径 | 视图 | 权限 | 说明 |
|------|------|:----:|------|
| `/` | HomeView | 公开 | 首页，商品导览 |
| `/products` | ProductList | 公开 | 商品列表（支持筛选搜索） |
| `/products/:id` | ProductDetail | 公开 | 商品详情 + 规格参数 |
| `/cart` | CartView | 顾客 | 购物车 |
| `/checkout` | Checkout | 顾客 | 结算下单 |
| `/orders` | OrderList | 顾客 | 我的订单 |
| `/orders/:id` | OrderDetail | 顾客 | 订单详情 |
| `/login` | Login | 公开 | 登录页 |
| `/register` | Register | 公开 | 注册页 |
| `/profile` | Profile | 顾客 | 个人信息/修改地址 |
| `/admin/dashboard` | Dashboard | 管理员 | 管理后台首页 |
| `/admin/sales` | SalesManage | 管理员 | 销售人员管理 |
| `/admin/products` | ProductManage | 管理员 | 商品管理 |
| `/admin/orders` | OrderManage | 管理员 | 全部订单查看 |
| `/admin/inventory-log` | InventoryLog | 管理员 | 出入库日志 |

### 3.2 状态管理 (Pinia)

```
stores/
├── auth.js      — token、当前用户信息、登录/登出方法
├── cart.js      — 购物车列表、添加/删除/修改数量
└── product.js   — 当前浏览的商品列表、筛选条件
```

### 3.3 API 层封装

所有前端请求统一通过 `api/index.js` 中的 axios 实例发出：

- **请求拦截器**：自动附带 JWT Token（从 Pinia auth store 读取）
- **响应拦截器**：统一处理错误码；401 时自动跳转登录页

---

## 4. 后端架构

### 4.1 分层架构

```
┌──────────────────────────────────────────────┐
│                  routes/                      │  ← 路由层：URL → Controller 映射
│         auth.routes.js, order.routes.js ...   │     公开路由 / 需认证路由 / 需角色路由
├──────────────────────────────────────────────┤
│               middlewares/                    │  ← 中间件层：横切关注点
│     auth.js, role.js, validator.js, ...       │     认证、授权、参数校验、错误处理
├──────────────────────────────────────────────┤
│              controllers/                     │  ← 控制器层：解析请求 → 调用服务 → 返回响应
│    auth.controller.js, order.controller.js... │     不写业务逻辑，只做参数提取与响应组装
├──────────────────────────────────────────────┤
│               services/                       │  ← 服务层：核心业务逻辑
│    auth.service.js, order.service.js ...      │     业务规则、流程编排、事务管理
├──────────────────────────────────────────────┤
│                  dao/                         │  ← 数据访问层：SQL 封装
│    user.dao.js, product.dao.js ...            │     CRUD 操作，返回原始数据
└──────────────────────────────────────────────┘
```

**调用方向严格单向**：`routes → middlewares → controllers → services → dao → MySQL`

禁止下层调用上层，禁止跨层调用。

### 4.2 统一响应格式

所有 API 返回如下 JSON 结构：

```json
{
  "code": 200,        // 业务状态码
  "message": "ok",    // 提示信息
  "data": {}          // 实际数据 (对象或数组)
}
```

| code | 含义 |
|:----:|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未登录 / Token 过期 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 4.3 模块职责

#### 4.3.1 认证模块 (auth)

- 顾客注册（姓名、性别、身份证号、密码）
- 顾客/员工登录，返回 JWT Token
- Token 续期

#### 4.3.2 商品模块 (product)

- 商品列表查询（分页、按类型筛选、关键字搜索）
- 商品详情查询（含规格参数）
- 管理员：商品添加、编辑、上架/下架

#### 4.3.3 购物车模块 (cart)

- 添加商品到购物车
- 修改数量、删除商品
- 结算时校验库存

#### 4.3.4 订单模块 (order)

- 提交订单（含收货地址、支付方式）
- 订单支付确认（在线支付回调 / 货到付款确认 / 现场结付确认）
- 超时未支付自动取消（24 小时定时任务）
- 订单状态流转：`待支付 → 已支付 → 已出库 → 配送中 → 已签收 / 已取消`
- 送货上门订单录入快递公司 + 单号

#### 4.3.5 用户模块 (user)

- 个人信息查看与修改（地址、手机号可改；姓名/性别/身份证不可改）
- 销售人员在后台为线下顾客注册

#### 4.3.6 库存模块 (inventory)

- 商品库存查询
- 出入库操作（出库：支付完成后触发；入库：供货 / 退货）
- 货架编号管理（`A-B-C` 格式）
- 库存同步：购买时扣减库存，取消时回退

#### 4.3.7 管理模块 (admin)

- 销售人员账号增删
- 全部订单查看
- 出入库日志查看

#### 4.3.8 日志模块 (log)

- 记录下单、支付、签收、出入库、订单取消等操作
- 日志查询（按时间、操作人、操作类型筛选）

### 4.4 中间件清单

| 中间件 | 说明 |
|--------|------|
| `auth.js` | 解析 JWT Token，注入 `req.user`，未登录返回 401 |
| `role.js` | 接收允许的角色列表，校验 `req.user.role`，不匹配返回 403 |
| `validator.js` | 基于 Joi 或 express-validator，校验请求体/查询参数 |
| `errorHandler.js` | 全局 try-catch，统一错误响应格式，避免敏感信息泄露 |

---

## 5. 数据库设计

### 5.1 ER 图简述

```
  ┌─────────┐       ┌──────────────┐       ┌─────────┐
  │  user   │──────<│    order     │>──────│ product │
  │         │       │              │       │         │
  │ 顾客    │       │  order_item  │       │ 商品    │
  │ 销售    │       │  (中间表)     │       │         │
  │ 仓库员  │       └──────┬───────┘       └────┬────┘
  │ 管理员  │              │                    │
  └────┬────┘              │ 出库时扣减         │
       │                   │                    │
       │ 顾客扩展信息       │              ┌────┴────┐
       ▼                   ▼              ▼         ▼
  ┌──────────┐    ┌──────────────┐  ┌───────────┐ ┌──────────┐
  │ customer │    │ system_log   │  │ inventory │ │  shelf   │
  └──────────┘    │ inventory_log│  └─────┬─────┘ └──────────┘
                  └──────────────┘        │
                                          │ 库存变更时
                                          ▼
                                   ┌──────────────┐
                                   │inventory_log │
                                   └──────────────┘
```

### 5.2 核心表设计

```sql
-- 1. 用户表 (所有角色统一存放)
user (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    username      VARCHAR(50)  NOT NULL UNIQUE,   -- 登录账号
    password      VARCHAR(255) NOT NULL,           -- bcrypt 加密
    role          ENUM('customer','sales','warehouse','admin') NOT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- 2. 顾客信息表 (1:1 扩展 user)
customer (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    user_id       INT NOT NULL UNIQUE,             -- FK → user.id
    real_name     VARCHAR(50)  NOT NULL,           -- 姓名 (不可改)
    gender        ENUM('男','女') NOT NULL,        -- 性别 (不可改)
    id_card       VARCHAR(18) NOT NULL,            -- 身份证号 (不可改)
    phone         VARCHAR(20),                     -- 手机号 (可改)
    address       VARCHAR(255)                     -- 收货地址 (可改)
)

-- 3. 商品表
product (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    name          VARCHAR(200) NOT NULL,           -- 商品名称
    category      VARCHAR(50)  NOT NULL,           -- 商品类型 (如"笔记本电脑")
    brand         VARCHAR(50),                     -- 品牌
    price         DECIMAL(10,2) NOT NULL,
    status        ENUM('on','off') DEFAULT 'on',  -- 上架/下架
    image_url     VARCHAR(255),                    -- 商品图片
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- 4. 商品规格参数表 (EAV 模式，适配不同商品类型)
product_spec (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    product_id    INT NOT NULL,                    -- FK → product.id
    spec_key      VARCHAR(50) NOT NULL,            -- 参数名 (如"处理器")
    spec_value    VARCHAR(200) NOT NULL,           -- 参数值 (如"AMD R7")
    spec_group    VARCHAR(50)                      -- 参数分组 (如"核心配置")
)

-- 5. 购物车表
cart (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    user_id       INT NOT NULL,                       -- FK → user.id
    product_id    INT NOT NULL,                       -- FK → product.id
    quantity      INT NOT NULL DEFAULT 1,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_product (user_id, product_id)  -- 同一用户同一商品合并
)

-- 6. 货架表
shelf (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    shelf_code    VARCHAR(20) NOT NULL UNIQUE,     -- 货架编号 A-B-C
    description   VARCHAR(100)                     -- 描述
)

-- 7. 库存表
inventory (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    product_id    INT NOT NULL UNIQUE,             -- FK → product.id
    shelf_id      INT,                             -- FK → shelf.id
    quantity      INT NOT NULL DEFAULT 0,          -- 当前库存数量
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE
)

-- 8. 订单表
`order` (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    order_no      VARCHAR(32) NOT NULL UNIQUE,     -- 订单编号 (生成)
    customer_id   INT NOT NULL,                    -- FK → customer.id
    sales_id      INT,                             -- FK → user.id (线下销售员, 可为空)
    total_amount  DECIMAL(10,2) NOT NULL,
    pay_method    ENUM('online','cod','offline') NOT NULL, -- 在线/货到付款/现场
    delivery_type ENUM('self_pickup','delivery') NOT NULL, -- 自提/送货上门
    address       VARCHAR(255),                    -- 收货地址 (送货上门时必填)
    express_company VARCHAR(50),                   -- 快递公司
    express_no    VARCHAR(50),                     -- 快递单号
    status        ENUM('pending','paid','shipped','delivering','signed','cancelled') DEFAULT 'pending',
    paid_at       DATETIME,                        -- 支付时间
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    cancelled_at  DATETIME                         -- 取消时间
)

-- 9. 订单明细表
order_item (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    order_id      INT NOT NULL,                    -- FK → order.id
    product_id    INT NOT NULL,                    -- FK → product.id
    quantity      INT NOT NULL,
    price         DECIMAL(10,2) NOT NULL           -- 下单时单价快照
)

-- 10. 出入库日志表
inventory_log (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    type          ENUM('in','out') NOT NULL,       -- 入库/出库
    product_id    INT NOT NULL,
    product_name  VARCHAR(200) NOT NULL,           -- 冗余，便于查询
    product_model VARCHAR(100),                    -- 型号
    quantity      INT NOT NULL,
    operator_id   INT NOT NULL,                    -- FK → user.id (操作员)
    order_id      INT,                             -- FK → order.id (关联订单)
    remark        VARCHAR(255),
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- 11. 系统日志表
system_log (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    action        VARCHAR(50) NOT NULL,            -- 操作类型: order_create/pay/sign/cancel/inventory_in/out
    operator_id   INT,                             -- FK → user.id
    target_type   VARCHAR(50),                     -- 操作对象类型: order/inventory
    target_id     INT,                             -- 操作对象 ID
    detail        TEXT,                            -- JSON 格式详情
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

---

## 6. 定时任务

| 任务 | 说明 | 执行频率 |
|------|------|:--------:|
| 订单超时取消 | 扫描 `pending` 状态且创建超 24h 的订单，自动取消并回退库存 | 每 5 分钟 |

> 使用 `node-cron` 或 `node-schedule` 实现，在 `server.js` 启动时注册。

---

## 7. 部署架构

```
┌──────────────────────────────────────────────┐
│                 宿主机 / VPS                   │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │         Docker: MySQL 8.0            │    │
│  │         Port: 3306                   │    │
│  │   Volume: ./data/mysql → /var/lib/mysql  │
│  └──────────────────────────────────────┘    │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │     Node.js 后端  (Port: 3000)        │    │
│  │     pm2 进程守护                      │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │     Vue 3 前端 (nginx 静态托管)        │    │
│  │     Port: 80                         │    │
│  └──────────────────────────────────────┘    │
│                                              │
└──────────────────────────────────────────────┘
```

**docker-compose.yml** (MySQL 部分):

```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    container_name: goods_mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: goods_manager
    ports:
      - "3306:3306"
    volumes:
      - ./data/mysql:/var/lib/mysql
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped
```

**环境变量 (.env)**:

```env
# 数据库连接
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=goods_manager

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d

# 服务端口
PORT=3000

# 订单超时时间 (小时)
ORDER_TIMEOUT_HOURS=24
```

---

## 8. 模块依赖关系

```
         ┌──────────────────────┐
         │     frontend/        │
         │   Vue 3 SPA          │
         └──────────┬───────────┘
                    │ HTTP (axios + JWT)
                    ▼
         ┌──────────────────────┐
         │     backend/         │
         │   Node.js + Express  │
         │                      │
         │  路由模块之间相互独立  │
         │  通过 services 协作   │
         │                      │
         │  order.service ──┬──► inventory.service  (出库扣库存)
         │                  ├──► log.service        (写日志)
         │                  └──► product.service    (查商品信息)
         │                      │
         │  inventory.service ─► log.service        (出入库写日志)
         └──────────┬───────────┘
                    │ mysql2 driver
                    ▼
         ┌──────────────────────┐
         │       MySQL          │
         │   (Docker Container) │
         └──────────────────────┘
```

---

## 9. 模块需求文档索引

各模块的详细需求已拆分到独立文档，存放于 [docs/modules/](docs/modules/) 目录下：

| 编号 | 文档 | 模块 | 核心职责 |
|:----:|------|------|------|
| 01 | [01-product.md](docs/modules/01-product.md) | 商品浏览与管理 | 商品列表/详情展示、搜索筛选、管理员商品增删改、规格参数维护 |
| 02 | [02-user-auth.md](docs/modules/02-user-auth.md) | 用户认证与个人信息 | 注册（线上+线下）、登录、JWT 认证、个人信息修改 |
| 03 | [03-cart.md](docs/modules/03-cart.md) | 购物车 | 购物车增删改、数量调整、库存校验、结算入口 |
| 04 | [04-order.md](docs/modules/04-order.md) | 订单管理 | 线上/线下订单全流程、支付、物流、签收、超时取消 |
| 05 | [05-inventory.md](docs/modules/05-inventory.md) | 库存管理 | 货架管理、出入库操作、库存查询与预警 |
| 06 | [06-admin.md](docs/modules/06-admin.md) | 管理后台 | 仪表盘、销售人员管理、全局订单/日志查看 |
| 07 | [07-log.md](docs/modules/07-log.md) | 系统日志 | 操作日志写入规范、日志查询、横切关注点 |

### 9.1 模块依赖关系

```
  ┌──────────┐     ┌──────────┐     ┌──────────┐
  │ 01-product│     │02-auth   │     │ 03-cart  │
  │ 商品模块  │     │ 认证模块  │     │ 购物车   │
  └────┬─────┘     └────┬─────┘     └────┬─────┘
       │                │                │
       │  商品数据       │  用户身份       │  下单前置
       ▼                ▼                ▼
  ┌──────────────────────────────────────────────────┐
  │                    04-order                       │
  │                    订单模块（核心交易）              │
  └──┬───────────────┬───────────────┬───────────────┘
     │               │               │
     │ 支付后扣库存   │ 写操作日志     │ 管理员查看
     ▼               ▼               ▼
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │05-inventory│ │ 07-log   │  │ 06-admin │
  │ 库存模块  │  │ 日志模块  │  │ 管理后台  │
  └──────────┘  └──────────┘  └──────────┘
```

### 9.2 各模块代码行数估算

| 模块 | 前端 (Vue) | 后端 (Node.js) | 合计（估算） |
|------|:--------:|:------------:|:---------:|
| 01-product | ~350 行 | ~250 行 | ~600 行 |
| 02-user-auth | ~250 行 | ~200 行 | ~450 行 |
| 03-cart | ~150 行 | ~120 行 | ~270 行 |
| 04-order | ~400 行 | ~350 行 | ~750 行 |
| 05-inventory | ~300 行 | ~250 行 | ~550 行 |
| 06-admin | ~250 行 | ~200 行 | ~450 行 |
| 07-log | ~100 行 | ~100 行 | ~200 行 |

> 每个模块（前端 + 后端）均控制在 800 行以内。对于接近上限的模块（如 04-order），可通过拆分组件（如将结算页、订单列表、订单详情独立为子组件）进一步降低单文件行数。

---

*文档版本：v1.1 | 编写日期：2026-06-03*
