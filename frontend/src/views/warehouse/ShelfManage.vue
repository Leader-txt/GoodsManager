<template>
  <div class="shelf-page" v-loading="loading">
    <div class="page-header">
      <h2>货架管理</h2>
      <el-button type="primary" @click="openAdd">+ 添加货架</el-button>
    </div>

    <el-table :data="shelves" stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="shelf_code" label="货架编号" />
      <el-table-column label="描述"><template #default="{ row }">{{ row.description || '-' }}</template></el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" link @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination :current-page="page" :page-size="10" :total="total" @current-change="p => { page = p; fetchShelves(); }" layout="total, prev, pager, next" style="margin-top: 16px; justify-content: center" />

    <!-- Add/Edit Modal -->
    <el-dialog v-model="showModal" :title="editingShelf ? '编辑货架' : '添加货架'" width="420px">
      <el-alert v-if="errMsg" :title="errMsg" type="error" show-icon :closable="false" style="margin-bottom: 12px" />
      <el-form :model="form" label-width="100px">
        <el-form-item label="货架编号" required>
          <el-input v-model="form.shelfCode" placeholder="如 4-1-1" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" placeholder="如 台式机区" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showModal = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { getShelves, createShelf, updateShelf, deleteShelf } from '@/api/inventory';
import { ElMessageBox } from 'element-plus';

const shelves = ref([]);
const total = ref(0);
const page = ref(1);
const loading = ref(false);
const showModal = ref(false);
const editingShelf = ref(null);
const saving = ref(false);
const errMsg = ref('');
const form = reactive({ shelfCode: '', description: '' });

async function fetchShelves() {
  loading.value = true;
  try {
    const res = await getShelves({ page: page.value });
    if (res.code === 200) { shelves.value = res.data.list; total.value = res.data.total; }
  } finally { loading.value = false; }
}

function openAdd() {
  editingShelf.value = null;
  form.shelfCode = '';
  form.description = '';
  errMsg.value = '';
  showModal.value = true;
}

function openEdit(shelf) {
  editingShelf.value = shelf;
  form.shelfCode = shelf.shelf_code;
  form.description = shelf.description || '';
  errMsg.value = '';
  showModal.value = true;
}

async function handleSave() {
  errMsg.value = '';
  if (!form.shelfCode.trim()) { errMsg.value = '请输入货架编号'; return; }
  if (!/^\d{1,2}-\d{1,2}-\d{1,2}$/.test(form.shelfCode.trim())) { errMsg.value = '货架编号格式须为数字-数字-数字（如 4-1-1）'; return; }

  saving.value = true;
  try {
    const data = { shelfCode: form.shelfCode.trim(), description: form.description.trim() };
    let res;
    if (editingShelf.value) {
      res = await updateShelf(editingShelf.value.id, data);
    } else {
      res = await createShelf(data);
    }
    if (res.code === 200) { showModal.value = false; fetchShelves(); }
    else { errMsg.value = res.message || '操作失败'; }
  } catch (err) { errMsg.value = err.message || '操作失败'; }
  finally { saving.value = false; }
}

async function handleDelete(id) {
  try {
    await ElMessageBox.confirm('确定要删除该货架吗？', '确认操作', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' });
    const res = await deleteShelf(id);
    if (res.code === 200) { fetchShelves(); }
    else { ElMessageBox.alert(res.message || '删除失败', '错误'); }
  } catch { /* 用户取消 */ }
}

onMounted(fetchShelves);
</script>

<style scoped>
.shelf-page { max-width: 800px; margin: 0 auto; padding: 24px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h2 { margin: 0; }
</style>
