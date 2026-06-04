<template>
  <div class="logistics-info" v-if="order.express_company">
    <h4>物流信息</h4>
    <el-descriptions :column="2" border size="small">
      <el-descriptions-item label="快递公司">{{ order.express_company }}</el-descriptions-item>
      <el-descriptions-item label="快递单号">{{ order.express_no }}</el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<script setup>
defineProps({ order: { type: Object, required: true } });
</script>

<style scoped>
.logistics-info {
  margin-top: 16px;
}
.logistics-info h4 {
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
}
</style>
