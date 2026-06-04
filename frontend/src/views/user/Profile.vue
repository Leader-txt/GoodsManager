<template>
  <div class="profile-page" v-loading="loading">
    <h2>个人信息</h2>
    <el-card v-if="profile" class="profile-card">
      <h3>基本信息（不可修改）</h3>
      <el-descriptions :column="2" border style="margin-bottom: 20px">
        <el-descriptions-item label="用户名">{{ profile.username }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ profile.realName }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ profile.gender }}</el-descriptions-item>
        <el-descriptions-item label="身份证号">{{ maskIdCard(profile.idCard) }}</el-descriptions-item>
      </el-descriptions>

      <h3>联系方式（可修改）</h3>
      <el-form label-width="80px">
        <el-form-item label="手机号">
          <el-input v-model="phoneForm.phone" placeholder="请输入手机号" style="width: 250px" />
          <el-button type="primary" @click="savePhone" :loading="phoneSaving" style="margin-left: 8px">保存</el-button>
        </el-form-item>
        <el-alert v-if="phoneMsg" :title="phoneMsg" :type="phoneMsgType" show-icon :closable="false" style="margin-bottom: 12px; margin-left: 80px" />

        <el-form-item label="收货地址">
          <el-input v-model="addressForm.address" placeholder="请输入收货地址" style="width: 300px" />
          <el-button type="primary" @click="saveAddress" :loading="addrSaving" style="margin-left: 8px">保存</el-button>
        </el-form-item>
        <el-alert v-if="addrMsg" :title="addrMsg" :type="addrMsgType" show-icon :closable="false" style="margin-bottom: 12px; margin-left: 80px" />
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { getProfile, updatePhone, updateAddress } from '@/api/user';

const profile = ref(null);
const loading = ref(true);
const phoneSaving = ref(false);
const addrSaving = ref(false);
const phoneMsg = ref('');
const phoneMsgType = ref('success');
const addrMsg = ref('');
const addrMsgType = ref('success');

const phoneForm = reactive({ phone: '' });
const addressForm = reactive({ address: '' });

function maskIdCard(card) {
  if (!card || card.length !== 18) return card;
  return card.slice(0, 4) + '**********' + card.slice(-4);
}

async function loadProfile() {
  try {
    const res = await getProfile();
    if (res.code === 200) {
      profile.value = res.data;
      phoneForm.phone = res.data.phone || '';
      addressForm.address = res.data.address || '';
    }
  } catch { /* handled by interceptor */ }
  finally { loading.value = false; }
}

async function savePhone() {
  if (!phoneForm.phone) { phoneMsg.value = '请输入手机号'; phoneMsgType.value = 'error'; return; }
  phoneSaving.value = true;
  phoneMsg.value = '';
  try {
    const res = await updatePhone(phoneForm.phone);
    if (res.code === 200) { phoneMsg.value = '手机号修改成功'; phoneMsgType.value = 'success'; }
  } catch (err) { phoneMsg.value = err.message || '修改失败'; phoneMsgType.value = 'error'; }
  finally { phoneSaving.value = false; }
}

async function saveAddress() {
  if (!addressForm.address) { addrMsg.value = '请输入收货地址'; addrMsgType.value = 'error'; return; }
  addrSaving.value = true;
  addrMsg.value = '';
  try {
    const res = await updateAddress(addressForm.address);
    if (res.code === 200) { addrMsg.value = '收货地址修改成功'; addrMsgType.value = 'success'; }
  } catch (err) { addrMsg.value = err.message || '修改失败'; addrMsgType.value = 'error'; }
  finally { addrSaving.value = false; }
}

onMounted(loadProfile);
</script>

<style scoped>
.profile-page { max-width: 680px; margin: 0 auto; }
.profile-page h2 { margin-bottom: 20px; }
.profile-card h3 { font-size: 15px; color: #333; border-bottom: 1px solid #f0f0f0; padding-bottom: 10px; margin-bottom: 16px; }
.profile-card h3:not(:first-child) { margin-top: 24px; }
</style>
