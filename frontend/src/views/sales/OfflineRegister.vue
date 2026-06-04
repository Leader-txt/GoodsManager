<template>
  <div class="offline-register">
    <h2>线下注册顾客</h2>
    <el-card class="form-card">
      <el-alert v-if="errMsg" :title="errMsg" type="error" show-icon :closable="false" style="margin-bottom: 16px" />

      <el-form :model="form" label-width="100px" @submit.prevent="handleSubmit">
        <el-form-item label="姓名" required>
          <el-input v-model="form.realName" placeholder="请输入顾客姓名（2-20个中文字符）" maxlength="20" />
        </el-form-item>
        <el-form-item label="性别" required>
          <el-radio-group v-model="form.gender">
            <el-radio value="男">男</el-radio>
            <el-radio value="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="身份证号" required>
          <el-input v-model="form.idCard" placeholder="请输入18位身份证号" maxlength="18" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="请输入手机号（选填）" maxlength="11" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting" style="width: 100%">{{ submitting ? '提交中...' : '确认注册' }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-dialog v-model="showResult" title="注册成功" width="400px">
      <el-alert type="success" :closable="false" show-icon style="margin-bottom: 12px">
        <template #title>
          <p>用户名：<strong>{{ result.username }}</strong></p>
          <p>初始密码：<strong>{{ result.initialPassword }}</strong></p>
        </template>
      </el-alert>
      <p class="result-tip">请将以上信息告知顾客，建议顾客首次登录后修改密码</p>
      <template #footer>
        <el-button type="primary" @click="showResult = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { offlineRegister } from '@/api/user';
import { isValidRealName, isValidIdCard, isValidPhone } from '@/utils/validators';

const form = reactive({ realName: '', gender: '男', idCard: '', phone: '' });
const errMsg = ref('');
const submitting = ref(false);
const showResult = ref(false);
const result = ref({ username: '', initialPassword: '' });

async function handleSubmit() {
  errMsg.value = '';
  if (!isValidRealName(form.realName)) { errMsg.value = '请输入正确的姓名（2-20个中文字符）'; return; }
  if (!form.gender) { errMsg.value = '请选择性别'; return; }
  if (!isValidIdCard(form.idCard)) { errMsg.value = '请输入正确的18位身份证号'; return; }
  if (form.phone && !isValidPhone(form.phone)) { errMsg.value = '手机号格式不正确'; return; }

  submitting.value = true;
  try {
    const res = await offlineRegister({
      realName: form.realName, gender: form.gender, idCard: form.idCard, phone: form.phone || undefined,
    });
    if (res.code === 200) {
      result.value = res.data;
      showResult.value = true;
      form.realName = ''; form.gender = '男'; form.idCard = ''; form.phone = '';
    } else { errMsg.value = res.message || '注册失败'; }
  } catch (err) { errMsg.value = err.message || '操作失败'; }
  finally { submitting.value = false; }
}
</script>

<style scoped>
.offline-register { max-width: 600px; margin: 0 auto; padding: 24px; }
.offline-register h2 { margin-bottom: 20px; }
.result-tip { color: #faad14; font-size: 13px; margin-top: 8px; }
</style>
