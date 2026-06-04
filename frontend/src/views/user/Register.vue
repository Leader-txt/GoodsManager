<template>
  <div class="register-page">
    <el-card class="register-card" shadow="always">
      <template #header><h2 style="text-align:center;margin:0">用户注册</h2></template>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="0" @submit.prevent="handleRegister">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="请输入11位手机号" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="6-20位，字母+数字" size="large" show-password />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" size="large" show-password />
        </el-form-item>
        <el-form-item prop="realName">
          <el-input v-model="form.realName" placeholder="请输入真实姓名" size="large" />
        </el-form-item>
        <el-form-item prop="gender">
          <el-radio-group v-model="form.gender">
            <el-radio value="男">男</el-radio>
            <el-radio value="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item prop="idCard">
          <el-input v-model="form.idCard" placeholder="请输入18位身份证号" size="large" />
        </el-form-item>
        <el-alert v-if="serverError" :title="serverError" type="error" show-icon :closable="false" style="margin-bottom: 12px" />
        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="loading" size="large" style="width: 100%">{{ loading ? '注册中...' : '注册' }}</el-button>
        </el-form-item>
      </el-form>
      <p class="switch-link">已有账号？<router-link to="/login">去登录</router-link></p>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { register as registerApi } from '@/api/auth';
import { isValidPhone, isValidPassword, isValidRealName, isValidIdCard } from '@/utils/validators';

const router = useRouter();
const formRef = ref(null);

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  realName: '',
  gender: '',
  idCard: '',
});

const validatePhone = (_rule, value, cb) => {
  if (!isValidPhone(value)) cb(new Error('请输入正确的手机号'));
  else cb();
};
const validatePassword = (_rule, value, cb) => {
  if (!isValidPassword(value)) cb(new Error('密码需6-20位且包含字母和数字'));
  else cb();
};
const validateConfirm = (_rule, value, cb) => {
  if (value !== form.password) cb(new Error('两次密码输入不一致'));
  else cb();
};
const validateName = (_rule, value, cb) => {
  if (!isValidRealName(value)) cb(new Error('姓名需2-20个中文字符'));
  else cb();
};
const validateIdCard = (_rule, value, cb) => {
  if (!isValidIdCard(value)) cb(new Error('请输入正确的18位身份证号'));
  else cb();
};

const rules = {
  username: [{ required: true, validator: validatePhone, trigger: 'blur' }],
  password: [{ required: true, validator: validatePassword, trigger: 'blur' }],
  confirmPassword: [{ required: true, validator: validateConfirm, trigger: 'blur' }],
  realName: [{ required: true, validator: validateName, trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  idCard: [{ required: true, validator: validateIdCard, trigger: 'blur' }],
};

const serverError = ref('');
const loading = ref(false);

async function handleRegister() {
  serverError.value = '';
  try {
    await formRef.value.validate();
  } catch { return; }

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
.register-card { width: 440px; }
.switch-link { text-align: center; color: #999; font-size: 14px; }
</style>
