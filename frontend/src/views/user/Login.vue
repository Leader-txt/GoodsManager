<template>
  <div class="login-page">
    <el-card class="login-card" shadow="always">
      <template #header><h2 style="text-align:center;margin:0">用户登录</h2></template>
      <el-form @submit.prevent="handleLogin" label-width="0">
        <el-form-item>
          <el-input v-model="form.username" placeholder="请输入注册手机号" size="large" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="请输入密码" size="large" show-password @keyup.enter="handleLogin" />
        </el-form-item>
        <el-alert v-if="errorMsg" :title="errorMsg" type="error" show-icon :closable="false" style="margin-bottom: 12px" />
        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="loading" size="large" style="width: 100%">{{ loading ? '登录中...' : '登录' }}</el-button>
        </el-form-item>
      </el-form>
      <p class="switch-link">没有账号？<router-link to="/register">去注册</router-link></p>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { login as loginApi } from '@/api/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const form = reactive({ username: '', password: '' });
const errorMsg = ref('');
const loading = ref(false);

async function handleLogin() {
  errorMsg.value = '';
  if (!form.username || !form.password) {
    errorMsg.value = '请输入用户名和密码';
    return;
  }
  loading.value = true;
  try {
    console.log(form.username)
    const res = await loginApi(form.username, form.password);
    if (res.code === 200) {
      authStore.login(res.data.token, res.data.user);
      const redirect = route.query.redirect || '/';
      router.push(redirect);
    }
  } catch (err) {
    errorMsg.value = err.message || '登录失败';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page { display: flex; justify-content: center; align-items: center; min-height: 70vh; }
.login-card { width: 400px; }
.switch-link { text-align: center; color: #999; font-size: 14px; }
</style>
