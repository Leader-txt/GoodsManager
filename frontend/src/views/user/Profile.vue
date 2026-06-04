<template>
  <div class="profile-page">
    <h2>个人信息</h2>
    <div class="profile-card" v-if="profile">
      <div class="info-section">
        <h3>基本信息（不可修改）</h3>
        <div class="info-row">
          <span class="label">用户名：</span>
          <span class="value">{{ profile.username }}</span>
        </div>
        <div class="info-row">
          <span class="label">姓名：</span>
          <span class="value">{{ profile.realName }}</span>
        </div>
        <div class="info-row">
          <span class="label">性别：</span>
          <span class="value">{{ profile.gender }}</span>
        </div>
        <div class="info-row">
          <span class="label">身份证号：</span>
          <span class="value">{{ maskIdCard(profile.idCard) }}</span>
        </div>
      </div>
      <div class="info-section">
        <h3>联系方式（可修改）</h3>
        <div class="info-row editable">
          <span class="label">手机号：</span>
          <input v-model="phoneForm.phone" type="text" placeholder="请输入手机号" />
          <button @click="savePhone" :disabled="phoneSaving" class="btn-save">
            {{ phoneSaving ? '保存中...' : '保存' }}
          </button>
        </div>
        <div v-if="phoneMsg" :class="phoneMsgType">{{ phoneMsg }}</div>
        <div class="info-row editable">
          <span class="label">收货地址：</span>
          <input v-model="addressForm.address" type="text" placeholder="请输入收货地址" class="addr-input" />
          <button @click="saveAddress" :disabled="addrSaving" class="btn-save">
            {{ addrSaving ? '保存中...' : '保存' }}
          </button>
        </div>
        <div v-if="addrMsg" :class="addrMsgType">{{ addrMsg }}</div>
      </div>
    </div>
    <div v-else-if="loading" class="loading">加载中...</div>
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
const phoneMsgType = ref('msg-success');
const addrMsg = ref('');
const addrMsgType = ref('msg-success');

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
  } catch {
    // handled by interceptor
  } finally {
    loading.value = false;
  }
}

async function savePhone() {
  if (!phoneForm.phone) { phoneMsg.value = '请输入手机号'; phoneMsgType.value = 'msg-error'; return; }
  phoneSaving.value = true;
  phoneMsg.value = '';
  try {
    const res = await updatePhone(phoneForm.phone);
    if (res.code === 200) { phoneMsg.value = '手机号修改成功'; phoneMsgType.value = 'msg-success'; }
  } catch (err) {
    phoneMsg.value = err.message || '修改失败';
    phoneMsgType.value = 'msg-error';
  } finally {
    phoneSaving.value = false;
  }
}

async function saveAddress() {
  if (!addressForm.address) { addrMsg.value = '请输入收货地址'; addrMsgType.value = 'msg-error'; return; }
  addrSaving.value = true;
  addrMsg.value = '';
  try {
    const res = await updateAddress(addressForm.address);
    if (res.code === 200) { addrMsg.value = '收货地址修改成功'; addrMsgType.value = 'msg-success'; }
  } catch (err) {
    addrMsg.value = err.message || '修改失败';
    addrMsgType.value = 'msg-error';
  } finally {
    addrSaving.value = false;
  }
}

onMounted(loadProfile);
</script>

<style scoped>
.profile-page { max-width: 640px; margin: 0 auto; }
.profile-page h2 { margin-bottom: 20px; }
.profile-card { background: #fff; border-radius: 8px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.info-section { margin-bottom: 24px; }
.info-section h3 { font-size: 16px; color: #333; border-bottom: 1px solid #f0f0f0; padding-bottom: 10px; margin-bottom: 16px; }
.info-row { display: flex; align-items: center; margin-bottom: 12px; }
.info-row .label { color: #999; width: 100px; flex-shrink: 0; font-size: 14px; }
.info-row .value { color: #333; font-size: 14px; }
.info-row.editable input { flex: 1; padding: 8px 10px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 14px; margin-right: 8px; }
.info-row.editable input:focus { border-color: #1890ff; outline: none; }
.addr-input { min-width: 250px; }
.btn-save { padding: 6px 16px; background: #1890ff; color: #fff; border: none; border-radius: 4px; font-size: 13px; white-space: nowrap; }
.btn-save:hover { background: #40a9ff; }
.btn-save:disabled { background: #91d5ff; cursor: not-allowed; }
.msg-success { color: #52c41a; font-size: 13px; margin-bottom: 12px; margin-left: 100px; }
.msg-error { color: #ff4d4f; font-size: 13px; margin-bottom: 12px; margin-left: 100px; }
.loading { text-align: center; color: #999; padding: 40px; }
</style>
