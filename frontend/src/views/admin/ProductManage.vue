<template>
  <div class="product-manage">
    <div class="page-header">
      <h2>商品管理</h2>
      <button @click="showForm = true; editingProduct = null; resetForm()" class="btn-add">+ 添加商品</button>
    </div>

    <!-- 商品表格 -->
    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th><th>名称</th><th>类型</th><th>品牌</th><th>价格</th><th>库存</th><th>状态</th><th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in products" :key="p.id">
          <td>{{ p.id }}</td>
          <td>{{ p.name }}</td>
          <td>{{ p.category }}</td>
          <td>{{ p.brand }}</td>
          <td>{{ formatPrice(p.price) }}</td>
          <td>{{ p.stockQuantity }}</td>
          <td><span :class="p.status === 'on' ? 'status-on' : 'status-off'">{{ p.status === 'on' ? '上架' : '下架' }}</span></td>
          <td class="actions">
            <button @click="editProduct(p)">编辑</button>
            <button @click="toggleStatus(p)">{{ p.status === 'on' ? '下架' : '上架' }}</button>
            <button @click="handleDelete(p)" class="btn-danger">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <Pagination :currentPage="currentPage" :pageSize="pageSize" :total="total" @change="changePage" />

    <!-- 添加/编辑弹窗 -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal-box">
        <h3>{{ editingProduct ? '编辑商品' : '添加商品' }}</h3>
        <div class="form-group">
          <label>商品名称 *</label>
          <input v-model="form.name" />
        </div>
        <div class="form-group">
          <label>商品类型 *</label>
          <select v-model="form.category">
            <option value="">请选择</option>
            <option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>品牌</label>
          <input v-model="form.brand" />
        </div>
        <div class="form-group">
          <label>价格 *</label>
          <input v-model.number="form.price" type="number" step="0.01" />
        </div>
        <div class="form-group">
          <label>图片URL</label>
          <input v-model="form.imageUrl" />
        </div>

        <!-- 规格参数编辑 -->
        <div class="spec-section">
          <h4>规格参数 <button type="button" @click="addSpecRow" class="btn-small">+ 添加行</button></h4>
          <div v-for="(spec, i) in form.specs" :key="i" class="spec-row">
            <input v-model="spec.specGroup" placeholder="分组" class="spec-input" />
            <input v-model="spec.specKey" placeholder="参数名" class="spec-input" />
            <input v-model="spec.specValue" placeholder="参数值" class="spec-input" />
            <button @click="form.specs.splice(i, 1)" class="btn-small btn-danger">删除</button>
          </div>
        </div>

        <div v-if="formError" class="form-error">{{ formError }}</div>
        <div class="modal-footer">
          <button @click="showForm = false" class="btn-cancel">取消</button>
          <button @click="saveProduct" :disabled="saving" class="btn-primary">{{ saving ? '保存中...' : '保存' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { getAdminProducts, createProduct, updateProduct, updateProductStatus, deleteProduct } from '@/api/product';
import Pagination from '@/components/common/Pagination.vue';
import { formatPrice } from '@/utils/format';

const products = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

const showForm = ref(false);
const editingProduct = ref(null);
const saving = ref(false);
const formError = ref('');

const categoryOptions = ['笔记本电脑','台式电脑','平板','智能手机','蓝牙耳机','摄像头','投影仪','电视','键盘','鼠标'];

const form = reactive({
  name: '', category: '', brand: '', price: 0, imageUrl: '', specs: [],
});

function resetForm() {
  form.name = ''; form.category = ''; form.brand = ''; form.price = 0; form.imageUrl = ''; form.specs = [];
  formError.value = '';
}

async function fetchProducts() {
  const res = await getAdminProducts({ page: currentPage.value, pageSize: pageSize.value });
  if (res.code === 200) { products.value = res.data.list; total.value = res.data.total; }
}

function editProduct(p) {
  editingProduct.value = p;
  form.name = p.name; form.category = p.category; form.brand = p.brand || '';
  form.price = p.price; form.imageUrl = p.image_url || ''; form.specs = p.specs ? [...p.specs] : [];
  showForm.value = true;
}

function addSpecRow() { form.specs.push({ specGroup: '', specKey: '', specValue: '' }); }

async function saveProduct() {
  if (!form.name || !form.category || !form.price) {
    formError.value = '请填写必填字段'; return;
  }
  saving.value = true; formError.value = '';
  try {
    const data = {
      name: form.name, category: form.category, brand: form.brand,
      price: form.price, imageUrl: form.imageUrl,
      specs: form.specs.filter(s => s.specKey && s.specValue),
    };
    if (editingProduct.value) {
      await updateProduct(editingProduct.value.id, data);
    } else {
      await createProduct(data);
    }
    showForm.value = false; editingProduct.value = null;
    await fetchProducts();
  } catch (err) {
    formError.value = err.message || '保存失败';
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(p) {
  const newStatus = p.status === 'on' ? 'off' : 'on';
  try {
    await updateProductStatus(p.id, newStatus);
    p.status = newStatus;
  } catch (err) {
    alert(err.message);
  }
}

async function handleDelete(p) {
  if (!confirm('确定删除该商品吗？')) return;
  try {
    await deleteProduct(p.id);
    await fetchProducts();
  } catch (err) {
    alert(err.message);
  }
}

function changePage(page) { currentPage.value = page; fetchProducts(); }

onMounted(fetchProducts);
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.btn-add { padding: 8px 20px; background: #1890ff; color: #fff; border: none; border-radius: 4px; }
.data-table { width: 100%; background: #fff; border-collapse: collapse; border-radius: 8px; overflow: hidden; }
.data-table th, .data-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
.data-table th { background: #fafafa; font-weight: 600; }
.actions button { margin-right: 4px; padding: 4px 10px; border: 1px solid #d9d9d9; background: #fff; border-radius: 3px; font-size: 12px; }
.status-on { color: #52c41a; } .status-off { color: #999; }
.btn-danger { color: #ff4d4f; border-color: #ff4d4f; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-box { background: #fff; border-radius: 8px; padding: 24px; width: 600px; max-height: 80vh; overflow-y: auto; }
.modal-box h3 { margin-bottom: 16px; }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; margin-bottom: 4px; font-size: 13px; color: #666; }
.form-group input, .form-group select { width: 100%; padding: 8px 10px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 14px; }
.spec-section { margin-bottom: 16px; }
.spec-section h4 { font-size: 14px; margin-bottom: 8px; }
.spec-row { display: flex; gap: 6px; margin-bottom: 6px; }
.spec-input { flex: 1; padding: 6px 8px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 13px; }
.btn-small { padding: 4px 10px; border: 1px solid #d9d9d9; background: #fff; border-radius: 3px; font-size: 12px; }
.form-error { color: #ff4d4f; margin-bottom: 12px; font-size: 13px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; }
.btn-cancel { padding: 8px 16px; border: 1px solid #d9d9d9; background: #fff; border-radius: 4px; }
.btn-primary { padding: 8px 16px; background: #1890ff; color: #fff; border: none; border-radius: 4px; }
</style>
