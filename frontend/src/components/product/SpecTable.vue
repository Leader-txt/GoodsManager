<template>
  <div class="spec-table" v-if="groups.length">
    <div v-for="group in groups" :key="group.name" class="spec-group">
      <h4 class="spec-group-title">{{ group.name }}</h4>
      <div class="spec-grid">
        <div v-for="spec in group.specs" :key="spec.specKey" class="spec-row">
          <span class="spec-key">{{ spec.specKey }}</span>
          <span class="spec-value">{{ spec.specValue }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({ specs: { type: Array, default: () => [] } });

const groups = computed(() => {
  const map = {};
  props.specs.forEach(s => {
    const g = s.specGroup || '其他';
    if (!map[g]) map[g] = [];
    map[g].push(s);
  });
  return Object.entries(map).map(([name, specs]) => ({ name, specs }));
});
</script>

<style scoped>
.spec-group { margin-bottom: 16px; }
.spec-group-title { font-size: 14px; color: #333; background: #fafafa; padding: 8px 12px; margin-bottom: 4px; border-left: 3px solid #1890ff; }
.spec-grid { padding: 0 12px; }
.spec-row { display: flex; padding: 6px 0; border-bottom: 1px solid #f0f0f0; }
.spec-key { color: #999; width: 120px; flex-shrink: 0; font-size: 13px; }
.spec-value { color: #333; font-size: 13px; }
</style>
