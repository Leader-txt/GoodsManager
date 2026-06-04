const authService = require('../services/auth.service');
const { success, error } = require('../utils/response');

const authController = {
  /** POST /api/auth/register */
  async register(req, res, next) {
    try {
      const { username, password, realName, gender, idCard } = req.body;

      // 参数校验
      if (!username || !password || !realName || !gender || !idCard) {
        return res.status(400).json(error(400, '缺少必填参数'));
      }
      if (!/^1[3-9]\d{9}$/.test(username)) {
        return res.status(400).json(error(400, '用户名需为11位手机号'));
      }
      if (password.length < 6 || password.length > 20) {
        return res.status(400).json(error(400, '密码需为6-20位'));
      }
      if (!/^[一-龥]{2,20}$/.test(realName)) {
        return res.status(400).json(error(400, '姓名需为2-20个中文字符'));
      }
      if (!/^\d{17}[\dXx]$/.test(idCard)) {
        return res.status(400).json(error(400, '身份证号格式不正确'));
      }

      const result = await authService.register({
        username,
        password,
        realName,
        gender,
        idCard,
      });

      res.json(success(result, '注册成功'));
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/auth/login */
  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json(error(400, '请输入用户名和密码'));
      }

      const result = await authService.login({ username, password });
      res.json(success(result, '登录成功'));
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
