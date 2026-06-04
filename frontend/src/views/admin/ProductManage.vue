<template>
  <div class="product-manage" v-loading="loading">
    <div class="page-header">
      <h2>商品管理</h2>
      <el-button type="primary" @click="openAdd">+ 添加商品</el-button>
    </div>

    <el-table :data="products" stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="category" label="类型" />
      <el-table-column prop="brand" label="品牌" />
      <el-table-column label="价格" :formatter="(r) => formatPrice(r.price)" />
      <el-table-column prop="stockQuantity" label="库存" />
      <el-table-column label="状态">
        <template #default="{ row }">
          <el-tag :type="row.status === 'on' ? 'success' : 'info'" size="small">{{ row.status === 'on' ? '上架' : '下架' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280">
        <template #default="{ row }">
          <el-button size="small" @click="editProduct(row)">编辑</el-button>
          <el-button size="small" :type="row.status === 'on' ? 'warning' : 'success'" @click="toggleStatus(row)">{{ row.status === 'on' ? '下架' : '上架' }}</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination :current-page="currentPage" :page-size="pageSize" :total="total" @current-change="changePage" layout="total, prev, pager, next" style="margin-top: 16px; justify-content: center" />

    <!-- 添加/编辑弹窗 -->
    <el-dialog v-model="showForm" :title="editingProduct ? '编辑商品' : '添加商品'" width="640px" :close-on-click-modal="false">
      <el-form :model="form" label-width="100px">
        <el-form-item label="商品名称" required><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="商品类型" required>
          <el-select v-model="form.category" placeholder="请选择" style="width: 100%">
            <el-option v-for="c in categoryOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="品牌"><el-input v-model="form.brand" /></el-form-item>
        <el-form-item label="价格" required><el-input-number v-model="form.price" :min="0" :precision="2" style="width: 100%" /></el-form-item>
        <el-form-item label="图片URL"><el-input v-model="form.imageUrl" placeholder="商品图片链接" /></el-form-item>
      </el-form>

      <div class="spec-section">
        <h4>规格参数 <el-button size="small" @click="addSpecRow">+ 添加行</el-button></h4>
        <div v-for="(spec, i) in form.specs" :key="i" style="display:flex;gap:6px;margin-bottom:6px">
          <el-input v-model="spec.specGroup" placeholder="分组" size="small" />
          <el-input v-model="spec.specKey" placeholder="参数名" size="small" />
          <el-input v-model="spec.specValue" placeholder="参数值" size="small" />
          <el-button size="small" type="danger" @click="form.specs.splice(i, 1)">删除</el-button>
        </div>
      </div>

      <el-alert v-if="formError" :title="formError" type="error" show-icon :closable="false" style="margin-top: 12px" />
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" @click="saveProduct" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { getAdminProducts, createProduct, updateProduct, updateProductStatus, deleteProduct } from '@/api/product';
import { ElMessageBox, ElMessage } from 'element-plus';
import { formatPrice } from '@/utils/format';

const products = ref([]); const total = ref(0); const currentPage = ref(1); const pageSize = ref(10); const loading = ref(false);
const showForm = ref(false); const editingProduct = ref(null); const saving = ref(false); const formError = ref('');

const categoryOptions = ['笔记本电脑','台式电脑','平板','智能手机','蓝牙耳机','摄像头','投影仪','电视','键盘','鼠标'];

const form = reactive({ name: '', category: '', brand: '', price: 0, imageUrl: '', specs: [] });

function resetForm() { form.name = ''; form.category = ''; form.brand = ''; form.price = 0; form.imageUrl = ''; form.specs = []; formError.value = ''; }

async function fetchProducts() {
  loading.value = true;
  const res = await getAdminProducts({ page: currentPage.value, pageSize: pageSize.value });
  if (res.code === 200) { products.value = res.data.list; total.value = res.data.total; }
  loading.value = false;
}

function openAdd() { editingProduct.value = null; resetForm(); showForm.value = true; }
function editProduct(p) {
  editingProduct.value = p;
  form.name = p.name; form.category = p.category; form.brand = p.brand || '';
  form.price = p.price; form.imageUrl = p.image_url || ''; form.specs = p.specs ? [...p.specs] : [];
  showForm.value = true;
}
function addSpecRow() { form.specs.push({ specGroup: '', specKey: '', specValue: '' }); }

async function saveProduct() {
  if (!form.name || !form.category || !form.price) { formError.value = '请填写必填字段'; return; }
  saving.value = true; formError.value = '';
  try {
    const data = { name: form.name, category: form.category, brand: form.brand, price: form.price, imageUrl: form.imageUrl, specs: form.specs.filter(s => s.specKey && s.specValue) };
    if (editingProduct.value) { await updateProduct(editingProduct.value.id, data); }
    else { await createProduct(data); }
    showForm.value = false; editingProduct.value = null;
    await fetchProducts();
  } catch (err) { formError.value = err.message || '保存失败'; }
  finally { saving.value = false; }
}

async function toggleStatus(p) {
  const newStatus = p.status === 'on' ? 'off' : 'on';
  try { await updateProductStatus(p.id, newStatus); p.status = newStatus; }
  catch (err) { ElMessage.error(err.message); }
}

async function handleDelete(p) {
  try {
    await ElMessageBox.confirm('确定删除该商品吗？', '确认操作', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' });
    await deleteProduct(p.id);
    await fetchProducts();
  } catch { /* 用户取消 */ }
}

function changePage(page) { currentPage.value = page; fetchProducts(); }

onMounted(fetchProducts);
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.spec-section { margin-top: 16px; }
.spec-section h4 { font-size: 14px; margin-bottom: 8px; }
</style>
