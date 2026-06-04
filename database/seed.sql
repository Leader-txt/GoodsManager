-- ============================================================
-- 联想旗舰店商品管理系统 — 测试数据填充
-- 运行时机: 在 init.sql 之后执行 (02_seed.sql)
-- init.sql 创建的用户: admin(1), warehouse01(2), sales01(3), customer01(4)
-- init.sql 创建的顾客: 测试顾客(user_id=4)
-- ============================================================
USE goods_manager;

-- 确保当前会话使用正确的字符集（防止 latin1→utf8mb4 双编码）
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 额外测试顾客
INSERT INTO `user` (`username`, `password`, `role`) VALUES
('13800138001', '$2b$10$UHEZ7DQIQgOCiAZO2zGTfuLQlsiGdMeVZhKF4NOU7fWQeJOOK4llK', 'customer');

INSERT INTO `customer` (`user_id`, `real_name`, `gender`, `id_card`, `phone`, `address`) VALUES
(5, '张小明', '男', '310101199502022345', '13800138001', '北京市海淀区中关村大街1号');
