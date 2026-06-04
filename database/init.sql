-- ============================================================
-- 联想旗舰店商品管理系统 — 数据库初始化脚本
-- Database: goods_manager
-- ============================================================

CREATE DATABASE IF NOT EXISTS goods_manager DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE goods_manager;

-- 确保当前会话使用正确的字符集（防止 latin1→utf8mb4 双编码）
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================
-- 1. 用户表 (所有角色统一存放)
-- ============================================================
CREATE TABLE IF NOT EXISTS `user` (
    `id`            INT PRIMARY KEY AUTO_INCREMENT,
    `username`      VARCHAR(50)  NOT NULL UNIQUE,
    `password`      VARCHAR(255) NOT NULL,
    `role`          ENUM('customer','sales','warehouse','admin') NOT NULL,
    `created_at`    DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 2. 顾客信息表 (1:1 扩展 user)
-- ============================================================
CREATE TABLE IF NOT EXISTS `customer` (
    `id`            INT PRIMARY KEY AUTO_INCREMENT,
    `user_id`       INT NOT NULL UNIQUE,
    `real_name`     VARCHAR(50)  NOT NULL,
    `gender`        ENUM('男','女') NOT NULL,
    `id_card`       VARCHAR(18) NOT NULL UNIQUE,
    `phone`         VARCHAR(20),
    `address`       VARCHAR(255),
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 3. 商品表
-- ============================================================
CREATE TABLE IF NOT EXISTS `product` (
    `id`            INT PRIMARY KEY AUTO_INCREMENT,
    `name`          VARCHAR(200) NOT NULL,
    `category`      VARCHAR(50)  NOT NULL,
    `brand`         VARCHAR(50),
    `price`         DECIMAL(10,2) NOT NULL,
    `status`        ENUM('on','off') DEFAULT 'on',
    `image_url`     VARCHAR(255),
    `created_at`    DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 4. 商品规格参数表 (EAV 模式)
-- ============================================================
CREATE TABLE IF NOT EXISTS `product_spec` (
    `id`            INT PRIMARY KEY AUTO_INCREMENT,
    `product_id`    INT NOT NULL,
    `spec_key`      VARCHAR(50) NOT NULL,
    `spec_value`    VARCHAR(200) NOT NULL,
    `spec_group`    VARCHAR(50),
    FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 5. 购物车表
-- ============================================================
CREATE TABLE IF NOT EXISTS `cart` (
    `id`            INT PRIMARY KEY AUTO_INCREMENT,
    `user_id`       INT NOT NULL,
    `product_id`    INT NOT NULL,
    `quantity`      INT NOT NULL DEFAULT 1,
    `created_at`    DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_user_product` (`user_id`, `product_id`),
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 6. 货架表
-- ============================================================
CREATE TABLE IF NOT EXISTS `shelf` (
    `id`            INT PRIMARY KEY AUTO_INCREMENT,
    `shelf_code`    VARCHAR(20) NOT NULL UNIQUE,
    `description`   VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 7. 库存表
-- ============================================================
CREATE TABLE IF NOT EXISTS `inventory` (
    `id`            INT PRIMARY KEY AUTO_INCREMENT,
    `product_id`    INT NOT NULL UNIQUE,
    `shelf_id`      INT,
    `quantity`      INT NOT NULL DEFAULT 0,
    `updated_at`    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`shelf_id`) REFERENCES `shelf`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 8. 订单表
-- ============================================================
CREATE TABLE IF NOT EXISTS `order` (
    `id`              INT PRIMARY KEY AUTO_INCREMENT,
    `order_no`        VARCHAR(32) NOT NULL UNIQUE,
    `customer_id`     INT NOT NULL,
    `sales_id`        INT,
    `total_amount`    DECIMAL(10,2) NOT NULL,
    `pay_method`      ENUM('online','cod','offline') NOT NULL,
    `delivery_type`   ENUM('self_pickup','delivery') NOT NULL,
    `address`         VARCHAR(255),
    `express_company` VARCHAR(50),
    `express_no`      VARCHAR(50),
    `status`          ENUM('pending','paid','shipped','delivering','signed','cancelled') DEFAULT 'pending',
    `paid_at`         DATETIME,
    `created_at`      DATETIME DEFAULT CURRENT_TIMESTAMP,
    `cancelled_at`    DATETIME,
    FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`),
    FOREIGN KEY (`sales_id`) REFERENCES `user`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 9. 订单明细表
-- ============================================================
CREATE TABLE IF NOT EXISTS `order_item` (
    `id`            INT PRIMARY KEY AUTO_INCREMENT,
    `order_id`      INT NOT NULL,
    `product_id`    INT NOT NULL,
    `quantity`      INT NOT NULL,
    `price`         DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `product`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 10. 出入库日志表
-- ============================================================
CREATE TABLE IF NOT EXISTS `inventory_log` (
    `id`            INT PRIMARY KEY AUTO_INCREMENT,
    `type`          ENUM('in','out') NOT NULL,
    `product_id`    INT NOT NULL,
    `product_name`  VARCHAR(200) NOT NULL,
    `product_model` VARCHAR(100),
    `quantity`      INT NOT NULL,
    `operator_id`   INT,
    `order_id`      INT,
    `remark`        VARCHAR(255),
    `created_at`    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`product_id`) REFERENCES `product`(`id`),
    FOREIGN KEY (`operator_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 11. 系统日志表
-- ============================================================
CREATE TABLE IF NOT EXISTS `system_log` (
    `id`            INT PRIMARY KEY AUTO_INCREMENT,
    `action`        VARCHAR(50) NOT NULL,
    `operator_id`   INT,
    `target_type`   VARCHAR(50),
    `target_id`     INT,
    `detail`        TEXT,
    `created_at`    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`operator_id`) REFERENCES `user`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 预置数据
-- ============================================================

-- 预置货架 (至少10个)
INSERT INTO `shelf` (`shelf_code`, `description`) VALUES
('1-1-1', '笔记本区-A区'),
('1-1-2', '笔记本区-B区'),
('1-2-1', '笔记本区-C区'),
('2-1-1', '台式机区'),
('2-2-1', '台式机区-二层'),
('3-1-1', '平板区'),
('3-1-2', '平板区-B区'),
('4-1-1', '手机区'),
('5-1-1', '配件区-耳机'),
('5-2-1', '配件区-摄像头'),
('6-1-1', '投影仪区'),
('7-1-1', '电视区'),
('8-1-1', '配件区-键盘鼠标');

-- 预置管理员账号: admin / admin123
-- 密码使用 bcrypt 加密，此处为 bcrypt hash of "admin123"
INSERT INTO `user` (`username`, `password`, `role`) VALUES
('admin', '$2b$10$fWPqY/PvHyOZnXgIWMqz7ukQ0GoyCUSL3pVxhvwdy8gytj5evpgcO', 'admin');

-- 预置仓库操作员: warehouse01 / abc123
INSERT INTO `user` (`username`, `password`, `role`) VALUES
('warehouse01', '$2b$10$UHEZ7DQIQgOCiAZO2zGTfuLQlsiGdMeVZhKF4NOU7fWQeJOOK4llK', 'warehouse');

-- 预置销售人员: sales01 / abc123
INSERT INTO `user` (`username`, `password`, `role`) VALUES
('sales01', '$2b$10$UHEZ7DQIQgOCiAZO2zGTfuLQlsiGdMeVZhKF4NOU7fWQeJOOK4llK', 'sales');

-- 预置普通顾客: customer01 / abc123
INSERT INTO `user` (`username`, `password`, `role`) VALUES
('customer01', '$2b$10$UHEZ7DQIQgOCiAZO2zGTfuLQlsiGdMeVZhKF4NOU7fWQeJOOK4llK', 'customer');

INSERT INTO `customer` (`user_id`, `real_name`, `gender`, `id_card`, `phone`, `address`) VALUES
(4, '测试顾客', '男', '310101199001011234', '13800138000', '上海市浦东新区张江高科技园区');

-- ============================================================
-- 10 种商品类型的示例商品 (每种至少 2 个)
-- ============================================================

-- 1. 笔记本电脑
INSERT INTO `product` (`name`, `category`, `brand`, `price`, `status`, `image_url`) VALUES
('联想拯救者 R9000P', '笔记本电脑', '联想', 8999.00, 'on', '/uploads/laptop_r9000p.jpg'),
('ThinkPad X1 Carbon', '笔记本电脑', 'ThinkPad', 6499.00, 'on', '/uploads/laptop_x1.jpg');

INSERT INTO `product_spec` (`product_id`, `spec_key`, `spec_value`, `spec_group`) VALUES
(1, '品牌', '联想（Lenovo）', '基本信息'),
(1, '商品名称', '联想拯救者 R9000P', '基本信息'),
(1, '系列', '联想-拯救者', '基本信息'),
(1, '类型', '游戏笔记本', '基本信息'),
(1, '颜色', '灰色', '基本信息'),
(1, '处理器', 'AMD R7', '核心配置'),
(1, '显卡型号', 'RTX 3060', '核心配置'),
(1, '内存容量', '16GB', '核心配置'),
(1, '固态硬盘', '512GB', '核心配置'),
(1, '屏幕尺寸', '16.0-16.9英寸', '屏幕'),
(1, '屏幕刷新率', '165Hz', '屏幕'),
(1, '系统', 'Windows 11', '软件'),
(2, '品牌', 'ThinkPad', '基本信息'),
(2, '商品名称', 'ThinkPad X1 Carbon', '基本信息'),
(2, '系列', 'ThinkPad X1', '基本信息'),
(2, '类型', '轻薄笔记本', '基本信息'),
(2, '颜色', '黑色', '基本信息'),
(2, '处理器', 'Intel i7', '核心配置'),
(2, '内存容量', '16GB', '核心配置'),
(2, '固态硬盘', '512GB', '核心配置'),
(2, '屏幕尺寸', '14.0英寸', '屏幕'),
(2, '系统', 'Windows 11', '软件');

-- 2. 台式电脑
INSERT INTO `product` (`name`, `category`, `brand`, `price`, `status`, `image_url`) VALUES
('联想天逸 510S', '台式电脑', '联想', 4599.00, 'on', '/uploads/desktop_tianyi.jpg'),
('联想拯救者 刃7000K', '台式电脑', '联想', 12999.00, 'on', '/uploads/desktop_ren.jpg');

INSERT INTO `product_spec` (`product_id`, `spec_key`, `spec_value`, `spec_group`) VALUES
(3, '品牌', '联想（Lenovo）', '基本信息'),
(3, '商品名称', '联想天逸 510S', '基本信息'),
(3, '处理器', 'Intel i5', '核心配置'),
(3, '内存容量', '16GB', '核心配置'),
(3, '固态硬盘', '512GB', '核心配置'),
(3, '系统', 'Windows 11', '软件'),
(4, '品牌', '联想（Lenovo）', '基本信息'),
(4, '商品名称', '联想拯救者 刃7000K', '基本信息'),
(4, '处理器', 'Intel i7', '核心配置'),
(4, '内存容量', '32GB', '核心配置'),
(4, '显卡型号', 'RTX 4070', '核心配置'),
(4, '固态硬盘', '1TB', '核心配置'),
(4, '系统', 'Windows 11', '软件');

-- 3. 平板
INSERT INTO `product` (`name`, `category`, `brand`, `price`, `status`, `image_url`) VALUES
('联想小新 Pad Pro', '平板', '联想', 2299.00, 'on', '/uploads/pad_xiaoxin.jpg'),
('联想拯救者 Y700', '平板', '联想', 1999.00, 'on', '/uploads/pad_y700.jpg');

INSERT INTO `product_spec` (`product_id`, `spec_key`, `spec_value`, `spec_group`) VALUES
(5, '品牌', '联想（Lenovo）', '基本信息'),
(5, '屏幕尺寸', '12.7英寸', '屏幕'),
(5, '内存容量', '8GB', '核心配置'),
(5, '存储容量', '256GB', '核心配置'),
(5, '系统', 'Android', '软件'),
(6, '品牌', '联想（Lenovo）', '基本信息'),
(6, '屏幕尺寸', '8.8英寸', '屏幕'),
(6, '内存容量', '12GB', '核心配置'),
(6, '存储容量', '256GB', '核心配置'),
(6, '系统', 'Android', '软件');

-- 4. 智能手机
INSERT INTO `product` (`name`, `category`, `brand`, `price`, `status`, `image_url`) VALUES
('摩托罗拉 edge 40 Pro', '智能手机', '摩托罗拉', 3999.00, 'on', '/uploads/phone_edge40.jpg'),
('摩托罗拉 razr 40 Ultra', '智能手机', '摩托罗拉', 5699.00, 'on', '/uploads/phone_razr40.jpg');

INSERT INTO `product_spec` (`product_id`, `spec_key`, `spec_value`, `spec_group`) VALUES
(7, '品牌', '摩托罗拉', '基本信息'),
(7, '屏幕尺寸', '6.67英寸', '屏幕'),
(7, '处理器', '骁龙 8 Gen 2', '核心配置'),
(7, '内存容量', '12GB', '核心配置'),
(7, '存储容量', '256GB', '核心配置'),
(7, '系统', 'Android 13', '软件'),
(8, '品牌', '摩托罗拉', '基本信息'),
(8, '屏幕尺寸', '6.9英寸', '屏幕'),
(8, '处理器', '骁龙 8+ Gen 1', '核心配置'),
(8, '内存容量', '8GB', '核心配置'),
(8, '存储容量', '256GB', '核心配置'),
(8, '系统', 'Android 13', '软件');

-- 5. 蓝牙耳机
INSERT INTO `product` (`name`, `category`, `brand`, `price`, `status`, `image_url`) VALUES
('联想 LP40 Pro', '蓝牙耳机', '联想', 129.00, 'on', '/uploads/earphone_lp40.jpg'),
('联想 XT83', '蓝牙耳机', '联想', 199.00, 'on', '/uploads/earphone_xt83.jpg');

INSERT INTO `product_spec` (`product_id`, `spec_key`, `spec_value`, `spec_group`) VALUES
(9, '品牌', '联想（Lenovo）', '基本信息'),
(9, '类型', '真无线', '基本信息'),
(9, '蓝牙版本', '5.3', '连接'),
(9, '续航', '约6小时', '电池'),
(10, '品牌', '联想（Lenovo）', '基本信息'),
(10, '类型', '真无线', '基本信息'),
(10, '蓝牙版本', '5.3', '连接'),
(10, '降噪', 'ANC主动降噪', '功能'),
(10, '续航', '约8小时', '电池');

-- 6. 摄像头
INSERT INTO `product` (`name`, `category`, `brand`, `price`, `status`, `image_url`) VALUES
('联想 500 FHD 摄像头', '摄像头', '联想', 299.00, 'on', '/uploads/cam_500fhd.jpg'),
('联想 300 FHD 摄像头', '摄像头', '联想', 199.00, 'on', '/uploads/cam_300fhd.jpg');

INSERT INTO `product_spec` (`product_id`, `spec_key`, `spec_value`, `spec_group`) VALUES
(11, '品牌', '联想（Lenovo）', '基本信息'),
(11, '分辨率', '1920×1080', '画质'),
(11, '接口', 'USB 2.0', '连接'),
(11, '麦克风', '内置双麦克风', '功能'),
(12, '品牌', '联想（Lenovo）', '基本信息'),
(12, '分辨率', '1920×1080', '画质'),
(12, '接口', 'USB 2.0', '连接'),
(12, '麦克风', '内置麦克风', '功能');

-- 7. 投影仪
INSERT INTO `product` (`name`, `category`, `brand`, `price`, `status`, `image_url`) VALUES
('联想 YOGA 7000', '投影仪', '联想', 2999.00, 'on', '/uploads/projector_yoga.jpg'),
('联想小新 100S', '投影仪', '联想', 1499.00, 'on', '/uploads/projector_xiaoxin.jpg');

INSERT INTO `product_spec` (`product_id`, `spec_key`, `spec_value`, `spec_group`) VALUES
(13, '品牌', '联想（Lenovo）', '基本信息'),
(13, '亮度', '800 ANSI流明', '画质'),
(13, '分辨率', '1920×1080', '画质'),
(13, '系统', 'Android TV', '软件'),
(14, '品牌', '联想（Lenovo）', '基本信息'),
(14, '亮度', '400 ANSI流明', '画质'),
(14, '分辨率', '1920×1080', '画质'),
(14, '系统', 'Android TV', '软件');

-- 8. 电视
INSERT INTO `product` (`name`, `category`, `brand`, `price`, `status`, `image_url`) VALUES
('联想 65英寸 智能电视', '电视', '联想', 3499.00, 'on', '/uploads/tv_65.jpg'),
('联想 55英寸 智能电视', '电视', '联想', 2499.00, 'on', '/uploads/tv_55.jpg');

INSERT INTO `product_spec` (`product_id`, `spec_key`, `spec_value`, `spec_group`) VALUES
(15, '品牌', '联想（Lenovo）', '基本信息'),
(15, '屏幕尺寸', '65英寸', '屏幕'),
(15, '分辨率', '3840×2160 (4K)', '画质'),
(15, '系统', 'Android TV', '软件'),
(16, '品牌', '联想（Lenovo）', '基本信息'),
(16, '屏幕尺寸', '55英寸', '屏幕'),
(16, '分辨率', '3840×2160 (4K)', '画质'),
(16, '系统', 'Android TV', '软件');

-- 9. 键盘
INSERT INTO `product` (`name`, `category`, `brand`, `price`, `status`, `image_url`) VALUES
('联想 K4803 键盘', '键盘', '联想', 79.00, 'on', '/uploads/kb_k4803.jpg'),
('联想 MK300 机械键盘', '键盘', '联想', 299.00, 'on', '/uploads/kb_mk300.jpg');

INSERT INTO `product_spec` (`product_id`, `spec_key`, `spec_value`, `spec_group`) VALUES
(17, '品牌', '联想（Lenovo）', '基本信息'),
(17, '类型', '薄膜键盘', '基本信息'),
(17, '连接方式', 'USB有线', '连接'),
(17, '布局', '104键', '物理特性'),
(18, '品牌', '联想（Lenovo）', '基本信息'),
(18, '类型', '机械键盘', '基本信息'),
(18, '轴体', '青轴', '核心配置'),
(18, '连接方式', 'USB有线', '连接'),
(18, '背光', 'RGB', '功能');

-- 10. 鼠标
INSERT INTO `product` (`name`, `category`, `brand`, `price`, `status`, `image_url`) VALUES
('联想 M300 无线鼠标', '鼠标', '联想', 59.00, 'on', '/uploads/mouse_m300.jpg'),
('联想拯救者 M500 游戏鼠标', '鼠标', '联想', 199.00, 'on', '/uploads/mouse_m500.jpg');

INSERT INTO `product_spec` (`product_id`, `spec_key`, `spec_value`, `spec_group`) VALUES
(19, '品牌', '联想（Lenovo）', '基本信息'),
(19, '类型', '无线鼠标', '基本信息'),
(19, '连接方式', '2.4GHz无线', '连接'),
(19, 'DPI', '1600', '性能'),
(20, '品牌', '联想（Lenovo）', '基本信息'),
(20, '类型', '游戏鼠标', '基本信息'),
(20, '连接方式', 'USB有线', '连接'),
(20, 'DPI', '16000', '性能'),
(20, '背光', 'RGB', '功能');

-- ============================================================
-- 库存初始数据 (每种商品 10-50 件)
-- ============================================================
INSERT INTO `inventory` (`product_id`, `shelf_id`, `quantity`) VALUES
(1, 1, 25),
(2, 2, 30),
(3, 4, 15),
(4, 5, 10),
(5, 6, 20),
(6, 7, 18),
(7, 8, 35),
(8, 8, 22),
(9, 9, 50),
(10, 9, 45),
(11, 10, 30),
(12, 10, 28),
(13, 11, 12),
(14, 11, 15),
(15, 12, 10),
(16, 12, 10),
(17, 13, 50),
(18, 13, 40),
(19, 13, 50),
(20, 13, 45);
