<template>
  <div class="offline-register">
    <h2>线下注册顾客</h2>
    <div class="form-card">
      <div v-if="errMsg" class="err-msg">{{ errMsg }}</div>

      <div class="form-group">
        <label>姓名 <span class="required">*</span></label>
        <input v-model="form.realName" type="text" placeholder="请输入顾客姓名（2-20个中文字符）" maxlength="20" />
      </div>

      <div class="form-group">
        <label>性别 <span class="required">*</span></label>
        <div class="radio-group">
          <label class="radio-label"><input v-model="form.gender" type="radio" value="男" /> 男</label>
          <label class="radio-label"><input v-model="form.gender" type="radio" value="女" /> 女</label>
        </div>
      </div>

      <div class="form-group">
        <label>身份证号 <span class="required">*</span></label>
        <input v-model="form.idCard" type="text" placeholder="请输入18位身份证号" maxlength="18" />
      </div>

      <div class="form-group">
        <label>手机号</label>
        <input v-model="form.phone" type="text" placeholder="请输入手机号（选填）" maxlength="11" />
      </div>

      <button @click="handleSubmit" :disabled="submitting" class="btn-submit">
        {{ submitting ? '提交中...' : '确认注册' }}
      </button>
    </div>

    <!-- 注册结果弹窗 -->
    <div v-if="showResult" class="modal-overlay" @click.self="showResult = false">
      <div class="modal-box">
        <h3>注册成功</h3>
        <div class="result-info">
          <p><span class="lbl">用户名：</span><strong>{{ result.username }}</strong></p>
          <p><span class="lbl">初始密码：</span><strong>{{ result.initialPassword }}</strong></p>
        </div>
        <p class="result-tip">请将以上信息告知顾客，建议顾客首次登录后修改密码</p>
        <button @click="showResult = false" class="btn-confirm">确定</button>
      </div>
    </div>
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

  if (!isValidRealName(form.realName)) {
    errMsg.value = '请输入正确的姓名（2-20个中文字符）';
    return;
  }
  if (!form.gender) {
    errMsg.value = '请选择性别';
    return;
  }
  if (!isValidIdCard(form.idCard)) {
    errMsg.value = '请输入正确的18位身份证号';
    return;
  }
  if (form.phone && !isValidPhone(form.phone)) {
    errMsg.value = '手机号格式不正确';
    return;
  }

  submitting.value = true;
  try {
    const res = await offlineRegister({
      realName: form.realName,
      gender: form.gender,
      idCard: form.idCard,
      phone: form.phone || undefined,
    });
    if (res.code === 200) {
      result.value = res.data;
      showResult.value = true;
      // Reset form
      form.realName = '';
      form.gender = '男';
      form.idCard = '';
      form.phone = '';
    } else {
      errMsg.value = res.message || '注册失败';
    }
  } catch (err) {
    errMsg.value = err.message || '操作失败';
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.offline-register { max-width: 600px; margin: 0 auto; padding: 24px; }
.offline-register h2 { margin-bottom: 20px; }
.form-card { background: #fff; padding: 24px; border-radius: 8px; }
.err-msg { background: #fff2f0; color: #ff4d4f; padding: 10px 14px; border-radius: 4px; margin-bottom: 16px; font-size: 13px; border: 1px solid #ffccc7; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 6px; font-size: 14px; color: #333; }
.required { color: #ff4d4f; }
.form-group input[type="text"] { width: 100%; padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 14px; box-sizing: border-box; }
.form-group input:focus { border-color: #1890ff; outline: none; }
.radio-group { display: flex; gap: 24px; }
.radio-label { font-size: 14px; display: flex; align-items: center; gap: 4px; }
.btn-submit { width: 100%; padding: 10px; background: #1890ff; color: #fff; border: none; border-radius: 4px; font-size: 15px; margin-top: 8px; }
.btn-submit:hover { background: #40a9ff; }
.btn-submit:disabled { background: #ccc; }

.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-box { background: #fff; padding: 28px; border-radius: 8px; width: 400px; max-width: 90%; }
.modal-box h3 { margin-bottom: 16px; }
.result-info { background: #f6ffed; padding: 16px; border-radius: 4px; margin-bottom: 12px; }
.result-info p { margin-bottom: 8px; font-size: 14px; }
.result-info .lbl { color: #666; }
.result-info strong { font-size: 16px; }
.result-tip { color: #faad14; font-size: 13px; margin-bottom: 16px; }
.btn-confirm { padding: 8px 24px; background: #1890ff; color: #fff; border: none; border-radius: 4px; font-size: 14px; }
.btn-confirm:hover { background: #40a9ff; }
</style>
