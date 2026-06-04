const userService = require('../services/user.service');
const { success, error } = require('../utils/response');

const userController = {
  /** GET /api/users/profile */
  async getProfile(req, res, next) {
    try {
      const profile = await userService.getProfile(req.user.userId);
      res.json(success(profile));
    } catch (err) {
      next(err);
    }
  },

  /** PUT /api/users/phone */
  async updatePhone(req, res, next) {
    try {
      const { phone } = req.body;
      if (!phone) {
        return res.status(400).json(error(400, '请输入手机号'));
      }
      const result = await userService.updatePhone(req.user.userId, phone);
      res.json(success(result, '手机号修改成功'));
    } catch (err) {
      next(err);
    }
  },

  /** PUT /api/users/address */
  async updateAddress(req, res, next) {
    try {
      const { address } = req.body;
      if (!address) {
        return res.status(400).json(error(400, '请输入收货地址'));
      }
      const result = await userService.updateAddress(req.user.userId, address);
      res.json(success(result, '收货地址修改成功'));
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/users/offline-register (sales角色) */
  async offlineRegister(req, res, next) {
    try {
      const { realName, gender, idCard, phone } = req.body;
      if (!realName || !gender || !idCard) {
        return res.status(400).json(error(400, '缺少必填参数(姓名/性别/身份证号)'));
      }
      const result = await userService.offlineRegister({ realName, gender, idCard, phone });
      res.json(success(result, '线下注册成功'));
    } catch (err) {
      next(err);
    }
  },
};

module.exports = userController;
