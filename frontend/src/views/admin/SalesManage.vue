<template>
  <div class="sales-manage" v-loading="loading">
    <div class="page-header">
      <h2>销售人员管理</h2>
      <el-button type="primary" @click="openAdd">+ 添加销售人员</el-button>
    </div>

    <el-table :data="sales" stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column label="角色"><template #default>销售人员</template></el-table-column>
      <el-table-column label="创建时间" :formatter="(r) => formatDate(r.created_at)" />
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          <el-button size="small" @click="handleReset(row)">重置密码</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination :current-page="page" :page-size="10" :total="total" @current-change="p=>{page=p;fetchSales()}" layout="total, prev, pager, next" style="margin-top: 16px; justify-content: center" />

    <!-- 添加弹窗 -->
    <el-dialog v-model="showAdd" title="添加销售人员" width="420px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名"><el-input v-model="form.username" /></el-form-item>
        <el-form-item label="密码"><el-input v-model="form.password" type="password" /></el-form-item>
        <el-form-item label="姓名"><el-input v-model="form.realName" /></el-form-item>
      </el-form>
      <div v-if="errMsg" class="err-msg">{{ errMsg }}</div>
      <template #footer>
        <el-button @click="showAdd = false">取消</el-button>
        <el-button type="primary" @click="handleAdd" :loading="adding">确认添加</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码结果弹窗 -->
    <el-dialog v-model="showPwdDialog" title="密码已重置" width="380px">
      <p>新密码：<strong>{{ newPwd }}</strong></p>
      <p class="tip">请将此密码告知销售人员</p>
      <template #footer>
        <el-button type="primary" @click="showPwdDialog = false; newPwd = ''">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { getSales, createSales, deleteSales, resetPassword } from '@/api/admin';
import { ElMessageBox } from 'element-plus';
import { formatDate } from '@/utils/format';

const sales = ref([]); const total = ref(0); const page = ref(1); const loading = ref(false);
const showAdd = ref(false); const adding = ref(false); const errMsg = ref('');
const form = reactive({ username:'', password:'', realName:'' });
const newPwd = ref('');
const showPwdDialog = ref(false);

async function fetchSales() {
  loading.value = true;
  const res = await getSales({ page: page.value }); if (res.code===200) { sales.value=res.data.list; total.value=res.data.total; }
  loading.value = false;
}
function openAdd() { form.username=''; form.password=''; form.realName=''; errMsg.value=''; showAdd.value=true; }
async function handleAdd() {
  errMsg.value=''; adding.value=true;
  try { await createSales({...form}); showAdd.value=false; await fetchSales(); }
  catch(e) { errMsg.value=e.message||'添加失败'; } finally { adding.value=false; }
}
async function handleDelete(s) {
  try {
    await ElMessageBox.confirm('确定删除该销售人员？', '确认操作', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' });
    await deleteSales(s.id); await fetchSales();
  } catch { /* 用户取消 */ }
}
async function handleReset(s) {
  try { const res = await resetPassword(s.id); if (res.code===200) { newPwd.value=res.data.newPassword; showPwdDialog.value=true; } }
  catch(e) { ElMessageBox.alert(e.message, '错误'); }
}
onMounted(fetchSales);
</script>

<style scoped>
.page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
.err-msg { color: #ff4d4f; margin: 8px 0; font-size: 13px; }
.tip { color: #999; font-size: 13px; margin-top: 8px; }
</style>
