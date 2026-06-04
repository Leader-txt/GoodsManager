const { customerDao } = require('../dao/user.dao');
const { success } = require('../utils/response');

const customerController = {
  /** GET /api/customers/search?keyword= — 搜索顾客 */
  async search(req, res, next) {
    try {
      const { keyword } = req.query;
      if (!keyword || keyword.trim().length === 0) {
        return res.json(success([], '请输入搜索关键词'));
      }
      const customers = await customerDao.search(keyword.trim());
      res.json(success(customers));
    } catch (err) {
      next(err);
    }
  },
};

module.exports = customerController;
