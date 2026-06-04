<template>
  <span class="order-status-tag" :style="{ background: color, color: '#fff' }">{{ text }}</span>
</template>

<script setup>
import { computed } from 'vue';
import { getOrderStatusText, getOrderStatusColor } from '@/utils/format';

const props = defineProps({ status: { type: String, required: true } });
const text = computed(() => getOrderStatusText(props.status));
const color = computed(() => getOrderStatusColor(props.status));
</script>

<style scoped>
.order-status-tag { display: inline-block; padding: 2px 10px; border-radius: 4px; font-size: 12px; }
</style>
