const productService = require('../services/product.service');
const { success, error } = require('../utils/response');

const productController = {
  /** GET /api/products */
  async list(req, res, next) {
    try {
      const { page, pageSize, keyword, category, brand, sort } = req.query;
      const result = await productService.list({
        page: parseInt(page, 10) || 1,
        pageSize: parseInt(pageSize, 10) || 12,
        keyword, category, brand, sort,
      });
      res.json(success(result));
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/products/:id */
  async detail(req, res, next) {
    try {
      const result = await productService.detail(parseInt(req.params.id, 10));
      res.json(success(result));
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/products/categories — 商品分类列表 */
  async categories(req, res) {
    res.json(success(productService.getCategories()));
  },

  /** GET /api/products/brands — 品牌列表 */
  async brands(req, res, next) {
    try {
      const brands = await productService.getBrands();
      res.json(success(brands));
    } catch (err) {
      next(err);
    }
  },

  // ===== 管理员接口 =====

  /** POST /api/admin/products */
  async create(req, res, next) {
    try {
      const result = await productService.create(req.body);
      res.json(success(result, '商品添加成功'));
    } catch (err) {
      next(err);
    }
  },

  /** PUT /api/admin/products/:id */
  async update(req, res, next) {
    try {
      const result = await productService.update(parseInt(req.params.id, 10), req.body);
      res.json(success(result, '商品编辑成功'));
    } catch (err) {
      next(err);
    }
  },

  /** PATCH /api/admin/products/:id/status */
  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const result = await productService.updateStatus(parseInt(req.params.id, 10), status);
      res.json(success(result, status === 'on' ? '已上架' : '已下架'));
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /api/admin/products/:id */
  async delete(req, res, next) {
    try {
      const result = await productService.delete(parseInt(req.params.id, 10));
      res.json(success(result, '商品已删除'));
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/admin/products */
  async listAdmin(req, res, next) {
    try {
      const { page, pageSize, keyword, category, brand } = req.query;
      const result = await productService.listAdmin({
        page: parseInt(page, 10) || 1,
        pageSize: parseInt(pageSize, 10) || 12,
        keyword, category, brand,
      });
      res.json(success(result));
    } catch (err) {
      next(err);
    }
  },
};

module.exports = productController;
