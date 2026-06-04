<template>
  <div class="sales-manage">
    <div class="page-header"><h2>销售人员管理</h2><button @click="showAdd=true" class="btn-add">+ 添加销售人员</button></div>
    <table class="data-table">
      <thead><tr><th>ID</th><th>用户名</th><th>角色</th><th>创建时间</th><th>操作</th></tr></thead>
      <tbody>
        <tr v-for="s in sales" :key="s.id">
          <td>{{ s.id }}</td><td>{{ s.username }}</td><td>销售人员</td>
          <td>{{ formatDate(s.created_at) }}</td>
          <td>
            <button @click="handleDelete(s)" class="btn-danger">删除</button>
            <button @click="handleReset(s)">重置密码</button>
          </td>
        </tr>
      </tbody>
    </table>
    <Pagination :currentPage="page" :pageSize="10" :total="total" @change="p=>{page=p;fetchSales()}" />

    <!-- 添加弹窗 -->
    <div v-if="showAdd" class="modal-overlay" @click.self="showAdd=false">
      <div class="modal-box">
        <h3>添加销售人员</h3>
        <div class="form-group"><label>用户名</label><input v-model="form.username" /></div>
        <div class="form-group"><label>密码</label><input v-model="form.password" type="password" /></div>
        <div class="form-group"><label>姓名</label><input v-model="form.realName" /></div>
        <div v-if="errMsg" class="err">{{ errMsg }}</div>
        <div class="modal-footer">
          <button @click="showAdd=false" class="btn-cancel">取消</button>
          <button @click="handleAdd" :disabled="adding" class="btn-primary">{{ adding ? '添加中...' : '确认添加' }}</button>
        </div>
      </div>
    </div>

    <!-- 重置密码结果弹窗 -->
    <div v-if="newPwd" class="modal-overlay" @click.self="newPwd=''">
      <div class="modal-box"><h3>密码已重置</h3><p>新密码：<strong>{{ newPwd }}</strong></p><p class="tip">请将此密码告知销售人员</p><button @click="newPwd=''" class="btn-primary">确定</button></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { getSales, createSales, deleteSales, resetPassword } from '@/api/admin';
import Pagination from '@/components/common/Pagination.vue';
import { formatDate } from '@/utils/format';

const sales = ref([]); const total = ref(0); const page = ref(1);
const showAdd = ref(false); const adding = ref(false); const errMsg = ref('');
const form = reactive({ username:'', password:'', realName:'' });
const newPwd = ref('');

async function fetchSales() {
  const res = await getSales({ page: page.value }); if (res.code===200) { sales.value=res.data.list; total.value=res.data.total; }
}
async function handleAdd() {
  errMsg.value=''; adding.value=true;
  try { await createSales({...form}); showAdd.value=false; form.username=''; form.password=''; form.realName=''; await fetchSales(); }
  catch(e) { errMsg.value=e.message||'添加失败'; } finally { adding.value=false; }
}
async function handleDelete(s) {
  if(!confirm('确定删除该销售人员？')) return;
  try { await deleteSales(s.id); await fetchSales(); } catch(e) { alert(e.message); }
}
async function handleReset(s) {
  try { const res = await resetPassword(s.id); if (res.code===200) newPwd.value=res.data.newPassword; }
  catch(e) { alert(e.message); }
}
onMounted(fetchSales);
</script>

<style scoped>
.page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
.btn-add { padding:8px 20px; background:#1890ff; color:#fff; border:none; border-radius:4px; font-size:14px; }
.data-table { width:100%; background:#fff; border-collapse:collapse; border-radius:8px; overflow:hidden; }
.data-table th,.data-table td { padding:10px 12px; text-align:left; border-bottom:1px solid #f0f0f0; font-size:13px; }
.data-table th { background:#fafafa; font-weight:600; }
.btn-danger { color:#ff4d4f; border-color:#ff4d4f; }
.data-table td button { margin-right:4px; padding:4px 10px; border:1px solid #d9d9d9; background:#fff; border-radius:3px; font-size:12px; }
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); display:flex; justify-content:center; align-items:center; z-index:1000; }
.modal-box { background:#fff; border-radius:8px; padding:24px; width:420px; }
.modal-box h3 { margin-bottom:16px; }
.form-group { margin-bottom:12px; }
.form-group label { display:block; margin-bottom:4px; font-size:13px; color:#666; }
.form-group input { width:100%; padding:8px 10px; border:1px solid #d9d9d9; border-radius:4px; font-size:14px; }
.err { color:#ff4d4f; margin-bottom:12px; font-size:13px; }
.tip { color:#999; font-size:13px; margin-top:8px; }
.modal-footer { display:flex; justify-content:flex-end; gap:8px; }
.btn-cancel { padding:8px 16px; border:1px solid #d9d9d9; background:#fff; border-radius:4px; }
.btn-primary { padding:8px 16px; background:#1890ff; color:#fff; border:none; border-radius:4px; }
</style>
