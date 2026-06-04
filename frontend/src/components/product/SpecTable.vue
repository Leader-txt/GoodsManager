<template>
  <div class="spec-table" v-if="groups.length">
    <div v-for="group in groups" :key="group.name" class="spec-group">
      <h4 class="spec-group-title">{{ group.name }}</h4>
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item
          v-for="spec in group.specs"
          :key="spec.specKey"
          :label="spec.specKey"
          :label-style="{ width: '140px', color: '#999' }"
        >{{ spec.specValue }}</el-descriptions-item>
      </el-descriptions>
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
.spec-group {
  margin-bottom: 16px;
}
.spec-group-title {
  font-size: 14px;
  color: #333;
  background: #fafafa;
  padding: 8px 12px;
  margin: 0 0 8px;
  border-left: 3px solid #1890ff;
}
</style>
