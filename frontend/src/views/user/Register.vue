<template>
  <div class="register-page">
    <div class="register-card">
      <h2>用户注册</h2>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label>用户名（手机号）<span class="required">*</span></label>
          <input v-model="form.username" type="text" placeholder="请输入11位手机号" />
          <span v-if="errors.username" class="field-error">{{ errors.username }}</span>
        </div>
        <div class="form-group">
          <label>密码<span class="required">*</span></label>
          <input v-model="form.password" type="password" placeholder="6-20位，字母+数字" />
          <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
        </div>
        <div class="form-group">
          <label>确认密码<span class="required">*</span></label>
          <input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" />
          <span v-if="errors.confirmPassword" class="field-error">{{ errors.confirmPassword }}</span>
        </div>
        <div class="form-group">
          <label>姓名<span class="required">*</span></label>
          <input v-model="form.realName" type="text" placeholder="请输入真实姓名" />
          <span v-if="errors.realName" class="field-error">{{ errors.realName }}</span>
        </div>
        <div class="form-group">
          <label>性别<span class="required">*</span></label>
          <div class="radio-group">
            <label class="radio-label"><input type="radio" v-model="form.gender" value="男" /> 男</label>
            <label class="radio-label"><input type="radio" v-model="form.gender" value="女" /> 女</label>
          </div>
          <span v-if="errors.gender" class="field-error">{{ errors.gender }}</span>
        </div>
        <div class="form-group">
          <label>身份证号<span class="required">*</span></label>
          <input v-model="form.idCard" type="text" placeholder="请输入18位身份证号" />
          <span v-if="errors.idCard" class="field-error">{{ errors.idCard }}</span>
        </div>
        <div v-if="serverError" class="error-msg">{{ serverError }}</div>
        <button type="submit" :disabled="loading" class="btn-primary">
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>
      <p class="switch-link">已有账号？<router-link to="/login">去登录</router-link></p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { register as registerApi } from '@/api/auth';
import { isValidPhone, isValidPassword, isValidRealName, isValidIdCard } from '@/utils/validators';

const router = useRouter();

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  realName: '',
  gender: '',
  idCard: '',
});

const errors = reactive({});
const serverError = ref('');
const loading = ref(false);

function validate() {
  Object.keys(errors).forEach(k => delete errors[k]);
  let valid = true;

  if (!isValidPhone(form.username)) { errors.username = '请输入正确的手机号'; valid = false; }
  if (!isValidPassword(form.password)) { errors.password = '密码需6-20位且包含字母和数字'; valid = false; }
  if (form.password !== form.confirmPassword) { errors.confirmPassword = '两次密码输入不一致'; valid = false; }
  if (!isValidRealName(form.realName)) { errors.realName = '姓名需2-20个中文字符'; valid = false; }
  if (!form.gender) { errors.gender = '请选择性别'; valid = false; }
  if (!isValidIdCard(form.idCard)) { errors.idCard = '请输入正确的18位身份证号'; valid = false; }

  return valid;
}

async function handleRegister() {
  serverError.value = '';
  if (!validate()) return;

  loading.value = true;
  try {
    const res = await registerApi({
      username: form.username,
      password: form.password,
      realName: form.realName,
      gender: form.gender,
      idCard: form.idCard,
    });
    if (res.code === 200) {
      router.push({ path: '/login', query: { registered: '1' } });
    }
  } catch (err) {
    serverError.value = err.message || '注册失败';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.register-page { display: flex; justify-content: center; align-items: center; min-height: 70vh; padding: 20px; }
.register-card { background: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); width: 440px; }
.register-card h2 { text-align: center; margin-bottom: 24px; color: #333; }
.form-group { margin-bottom: 14px; }
.form-group label { display: block; margin-bottom: 4px; color: #666; font-size: 14px; }
.required { color: #ff4d4f; }
.form-group input[type="text"],
.form-group input[type="password"] { width: 100%; padding: 9px 12px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 14px; }
.form-group input:focus { border-color: #1890ff; outline: none; box-shadow: 0 0 0 2px rgba(24,144,255,0.2); }
.radio-group { display: flex; gap: 20px; }
.radio-label { cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 4px; }
.field-error { color: #ff4d4f; font-size: 12px; display: block; margin-top: 4px; }
.error-msg { color: #ff4d4f; font-size: 14px; margin-bottom: 12px; text-align: center; }
.btn-primary { width: 100%; padding: 10px; background: #1890ff; color: #fff; border: none; border-radius: 4px; font-size: 16px; }
.btn-primary:hover { background: #40a9ff; }
.btn-primary:disabled { background: #91d5ff; cursor: not-allowed; }
.switch-link { text-align: center; margin-top: 16px; color: #999; font-size: 14px; }
</style>
