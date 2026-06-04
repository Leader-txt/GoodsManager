<template>
  <div class="logistics-info" v-if="order.express_company">
    <h4>物流信息</h4>
    <div class="logistics-row"><span class="label">快递公司：</span>{{ order.express_company }}</div>
    <div class="logistics-row"><span class="label">快递单号：</span>{{ order.express_no }}</div>
  </div>
</template>

<script setup>
defineProps({ order: { type: Object, required: true } });
</script>

<style scoped>
.logistics-info { background: #fafafa; padding: 16px; border-radius: 4px; margin-top: 16px; }
.logistics-info h4 { margin-bottom: 8px; font-size: 14px; }
.logistics-row { margin-bottom: 4px; font-size: 13px; color: #666; }
.label { color: #999; }
</style>
