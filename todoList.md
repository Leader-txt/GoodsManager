# 联想旗舰店商品管理系统 — Todo List

> 按依赖顺序排列，勾选表示已完成。

---

## 阶段 0：基础设施搭建

### 0.1 数据库
- [x] `database/docker-compose.yml` — MySQL 8.0 Docker 编排
- [x] `database/init.sql` — 11 张表 DDL + 4 个预置账号 + 20 个种子商品 + 13 个货架 + 库存数据
- [x] `database/seed.sql` — 额外测试数据

### 0.2 后端脚手架
- [x] `backend/package.json` — express, mysql2, jsonwebtoken, bcrypt, node-cron, cors, dotenv
- [x] `backend/.env.example` + `.env` — 完整环境变量模板
- [x] `backend/src/config/db.js` — mysql2 连接池
- [x] `backend/src/config/index.js` — dotenv 配置入口
- [x] `backend/src/utils/response.js` — 统一响应格式 `{ code, message, data }`
- [x] `backend/src/utils/jwt.js` — JWT 签发 & 验证
- [x] `backend/src/utils/password.js` — bcrypt 加密 & 比对
- [x] `backend/src/middlewares/auth.js` — JWT 认证中间件
- [x] `backend/src/middlewares/role.js` — 角色权限中间件
- [x] `backend/src/middlewares/validator.js` — 请求参数校验中间件
- [x] `backend/src/middlewares/errorHandler.js` — 全局错误处理
- [x] `backend/src/app.js` — Express 应用初始化
- [x] `backend/src/server.js` — 服务启动入口（含 node-cron 超时取消）
- [x] `backend/src/routes/index.js` — 路由汇总 + 健康检查
- [x] `GET /api/health` 返回 `{ code: 200, message: "ok" }`

### 0.3 前端脚手架
- [x] `frontend/package.json` — vue 3, vite, pinia, axios, vue-router
- [x] `frontend/vite.config.js` — Vite 配置 + @ 别名 + devServer proxy
- [x] `frontend/index.html` — HTML 入口
- [x] `frontend/src/main.js` — Vue 应用入口（注册 Pinia + Router）
- [x] `frontend/src/App.vue` — 根组件 + `<router-view>` + AppHeader
- [x] `frontend/src/api/index.js` — axios 实例 + 拦截器
- [x] `frontend/src/router/index.js` — 16 条路由 + beforeEach 守卫
- [x] `frontend/src/stores/auth.js` — 用户登录状态 (token, user, login/logout)
- [x] `frontend/src/stores/cart.js` — 购物车状态 (items, count, 增删改查)
- [x] `frontend/src/stores/product.js` — 商品浏览状态
- [x] `frontend/src/utils/validators.js` — 手机号/密码/身份证/姓名校验
- [x] `frontend/src/utils/format.js` — 价格/日期/订单状态格式化
- [x] `frontend/src/components/layout/AppHeader.vue` — 导航栏 + 角色菜单 + 购物车角标
- [x] `frontend/src/components/common/Pagination.vue` — 通用分页组件
- [x] `frontend/src/components/common/ConfirmDialog.vue` — 通用确认弹窗
- [x] `npm run build` 构建成功

---

## 阶段 1：用户认证与个人信息 (Module 02)

### 1.1 后端
- [x] `user.dao.js` — user + customer 表 CRUD
- [x] `auth.service.js` — 注册（事务：user + customer）、登录（bcrypt + JWT）
- [x] `user.service.js` — 个人信息、修改手机号、修改地址、线下注册
- [x] `auth.controller.js` — register, login
- [x] `user.controller.js` — getProfile, updatePhone, updateAddress, offlineRegister
- [x] `auth.routes.js` — POST /api/auth/register, POST /api/auth/login
- [x] `user.routes.js` — GET profile, PUT phone, PUT address, POST offline-register

### 1.2 前端
- [x] `api/auth.js` — 登录/注册 API
- [x] `api/user.js` — 用户信息 API
- [x] `Login.vue` — 登录表单 + 错误提示 + 登录后跳转
- [x] `Register.vue` — 注册表单 + 前端校验（手机号/密码/姓名/身份证）
- [x] `Profile.vue` — 信息展示（不可改字段置灰）+ 手机号/地址独立编辑

---

## 阶段 2：商品浏览与管理 (Module 01)

### 2.1 后端
- [x] `product.dao.js` — product + product_spec 表 CRUD（动态 WHERE 筛选）
- [x] `product.service.js` — 商品列表（分页+筛选+排序+JOIN 库存）、详情、管理员增删改
- [x] `product.controller.js` — list, detail, categories, CRUD, updateStatus
- [x] `product.routes.js` — 公开 + 管理接口路由

### 2.2 前端
- [x] `api/product.js` — 商品 API 封装
- [x] `ProductCard.vue` — 商品卡片（图片/名称/价格/库存/缺货遮罩）
- [x] `SpecTable.vue` — 规格参数分组展示组件
- [x] `ProductList.vue` — 搜索 + 类型筛选 + 排序 + 商品卡片网格 + 分页
- [x] `ProductDetail.vue` — 大图 + 规格参数 + 库存状态 + 加入购物车
- [x] `ProductManage.vue` — 管理员表格 + 添加/编辑表单 + 动态规格参数编辑

---

## 阶段 3：购物车 (Module 03)

### 3.1 后端
- [x] `cart.dao.js` — cart 表 CRUD（INSERT ... ON DUPLICATE KEY UPDATE）
- [x] `cart.service.js` — 获取列表（JOIN product + inventory）、加入、修改数量、删除、清空
- [x] `cart.controller.js` — list, add, updateQuantity, remove, clearSelected
- [x] `cart.routes.js` — 全部接口（顾客角色）

### 3.2 前端
- [x] `api/cart.js` — 购物车 API 封装
- [x] `CartView.vue` — 全选/取消 + 数量调整 + 删除 + 金额计算 + 空状态 + 库存不足提示
- [x] 导航栏购物车角标（Pinia cart store）
- [x] 商品详情页加入购物车功能
- [x] `stores/cart.js` — selected 状态管理、角标数量、fetchCart

---

## 阶段 4：订单管理 (Module 04)

### 4.1 后端
- [x] `order.dao.js` — order + order_item 表 CRUD + 订单号生成
- [x] `order.service.js` — 提交订单（事务）、支付（扣库存）、取消（回退库存）、签收、线下订单、超时取消
- [x] `order.controller.js` — create, list, detail, pay, cancel, sign, createOffline
- [x] `order.routes.js` — 顾客 + 销售接口路由
- [x] node-cron 定时任务 — 每 5 分钟扫描超时 pending 订单自动取消

### 4.2 前端
- [x] `api/order.js` — 订单 API 封装
- [x] `Checkout.vue` — 结算页：地址选择 + 支付/提货方式 + 提交
- [x] `OrderList.vue` — 状态筛选标签 + 倒计时(待支付) + 操作按钮
- [x] `OrderDetail.vue` — 状态时间线 + 商品明细 + 物流信息
- [x] `OrderStatusTag.vue` — 订单状态标签组件
- [x] `LogisticsInfo.vue` — 物流信息展示组件

---

## 阶段 5：库存管理 (Module 05)

### 5.1 后端
- [x] `inventory.dao.js` — shelf + inventory + inventory_log 表 CRUD
- [x] `inventory.service.js` — 货架增删改查、库存列表、入库（UPSERT）、出库（校验+扣减）、批量出库
- [x] `inventory.controller.js` — shelves CRUD, inventory list/detail, stockIn, stockOut, stockOutBatch
- [x] `inventory.routes.js` — 货架 + 库存 + 出入库接口

### 5.2 前端
- [x] `api/inventory.js` — 库存 API 封装

---

## 阶段 6：管理后台 (Module 06)

### 6.1 后端
- [x] `admin.service.js` — 仪表盘统计、销售人员增删（验证未完成订单）、密码重置
- [x] `admin.controller.js` — dashboard, listSales, createSales, deleteSales, resetPassword, listOrders
- [x] 管理后台路由挂载在 `routes/index.js`

### 6.2 前端
- [x] `api/admin.js` — 管理后台 API 封装
- [x] `Dashboard.vue` — 4 张统计卡片 + 最近订单 + 最近出入库
- [x] `SalesManage.vue` — 销售人员列表 + 添加弹窗 + 删除 + 重置密码
- [x] `OrderManage.vue` — 全局订单表格 + 搜索筛选
- [x] `InventoryLog.vue` — 出入库日志 + 类型/时间筛选

---

## 阶段 7：系统日志 (Module 07)

### 7.1 后端
- [x] `log.dao.js` — system_log 表 INSERT + 分页查询（多条件筛选）
- [x] `log.service.js` — writeLog() 通用方法
- [x] `log.controller.js` — queryLogs
- [x] 系统日志接口挂载在管理后台

### 7.2 前端
- [x] `SystemLog.vue` — 系统日志查询页面 + 操作类型/时间筛选

---

## 进度统计

| 阶段 | 内容 | 状态 |
|------|------|:----:|
| 阶段 0 | 基础设施搭建（数据库 + 前后端脚手架） | ✅ 完成 |
| 阶段 1 | 用户认证与个人信息 | ✅ 完成 |
| 阶段 2 | 商品浏览与管理 | ✅ 完成 |
| 阶段 3 | 购物车 | ✅ 完成 |
| 阶段 4 | 订单管理 + 定时任务 | ✅ 完成 |
| 阶段 5 | 库存管理 | ✅ 完成 |
| 阶段 6 | 管理后台 | ✅ 完成 |
| 阶段 7 | 系统日志 | ✅ 完成 |

### 产出统计

| 类别 | 文件数 |
|------|:------:|
| 后端源文件 (`backend/src/`) | 40 |
| 前端源文件 (`frontend/src/`) | 39 |
| 数据库文件 (`database/`) | 3 |
| 文档文件 (`docs/`) | 9 |
| **合计** | **91** |

---

*Todo List 版本：v1.0 | 最后更新：2026-06-03*
