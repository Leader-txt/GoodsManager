<template>
  <div class="shelf-page"><h2>货架管理</h2>
    <button @click="openAdd" class="btn-add">+ 添加货架</button>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else>
      <table class="data-table">
        <thead><tr><th>ID</th><th>货架编号</th><th>描述</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="s in shelves" :key="s.id">
            <td>{{ s.id }}</td><td>{{ s.shelf_code }}</td><td>{{ s.description || '-' }}</td>
            <td>
              <button @click="openEdit(s)" class="btn-link">编辑</button>
              <button @click="handleDelete(s.id)" class="btn-link btn-danger">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <Pagination :currentPage="page" :pageSize="10" :total="total" @change="p => { page = p; fetchShelves(); }" />
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-box">
        <h3>{{ editingShelf ? '编辑货架' : '添加货架' }}</h3>
        <div v-if="errMsg" class="err-msg">{{ errMsg }}</div>
        <div class="form-group">
          <label>货架编号 <span class="required">*</span></label>
          <input v-model="form.shelfCode" type="text" placeholder="如 4-1-1" />
        </div>
        <div class="form-group">
          <label>描述</label>
          <input v-model="form.description" type="text" placeholder="如 台式机区" />
        </div>
        <div class="modal-actions">
          <button @click="showModal = false" class="btn-cancel">取消</button>
          <button @click="handleSave" :disabled="saving" class="btn-confirm">{{ saving ? '保存中...' : '确认' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { getShelves, createShelf, updateShelf, deleteShelf } from '@/api/inventory';
import Pagination from '@/components/common/Pagination.vue';

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
  if (!confirm('确定要删除该货架吗？')) return;
  try {
    const res = await deleteShelf(id);
    if (res.code === 200) { fetchShelves(); }
    else { alert(res.message || '删除失败'); }
  } catch (err) { alert(err.message || '删除失败'); }
}

onMounted(fetchShelves);
</script>

<style scoped>
.shelf-page { max-width: 800px; margin: 0 auto; padding: 24px; }
.shelf-page h2 { margin-bottom: 16px; }
.btn-add { padding: 8px 16px; background: #1890ff; color: #fff; border: none; border-radius: 4px; font-size: 14px; margin-bottom: 12px; }
.data-table { width: 100%; background: #fff; border-collapse: collapse; border-radius: 8px; overflow: hidden; font-size: 13px; }
.data-table th, .data-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #f0f0f0; }
.data-table th { background: #fafafa; }
.btn-link { background: none; border: none; color: #1890ff; cursor: pointer; font-size: 13px; padding: 2px 4px; }
.btn-danger { color: #ff4d4f; }
.loading { text-align: center; padding: 60px; color: #999; }

.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-box { background: #fff; padding: 24px; border-radius: 8px; width: 420px; max-width: 90%; }
.modal-box h3 { margin-bottom: 16px; }
.err-msg { background: #fff2f0; color: #ff4d4f; padding: 8px 12px; border-radius: 4px; margin-bottom: 12px; font-size: 13px; }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; margin-bottom: 4px; font-size: 14px; }
.required { color: #ff4d4f; }
.form-group input { width: 100%; padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 14px; box-sizing: border-box; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
.btn-cancel { padding: 8px 16px; background: #fff; border: 1px solid #d9d9d9; border-radius: 4px; }
.btn-confirm { padding: 8px 16px; background: #1890ff; color: #fff; border: none; border-radius: 4px; }
.btn-confirm:disabled { background: #ccc; }
</style>
