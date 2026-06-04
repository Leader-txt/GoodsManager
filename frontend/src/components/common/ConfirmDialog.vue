<template>
  <div v-if="visible" class="dialog-overlay" @click.self="$emit('cancel')">
    <div class="dialog-box">
      <h3 class="dialog-title">{{ title }}</h3>
      <p class="dialog-body">{{ message }}</p>
      <div class="dialog-footer">
        <button class="btn-cancel" @click="$emit('cancel')">取消</button>
        <button class="btn-confirm" @click="$emit('confirm')">确认</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '确认操作' },
  message: { type: String, default: '确定要执行此操作吗？' },
});

defineEmits(['confirm', 'cancel']);
</script>

<style scoped>
.dialog-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.45); display: flex;
  justify-content: center; align-items: center; z-index: 1000;
}
.dialog-box {
  background: #fff; border-radius: 8px; padding: 24px;
  min-width: 360px; max-width: 480px;
}
.dialog-title { font-size: 16px; margin-bottom: 12px; }
.dialog-body { color: #666; margin-bottom: 20px; }
.dialog-footer { text-align: right; }
.btn-cancel, .btn-confirm {
  padding: 6px 16px; border-radius: 4px; border: 1px solid #d9d9d9;
  margin-left: 8px; background: #fff;
}
.btn-confirm { background: #1890ff; color: #fff; border-color: #1890ff; }
</style>
