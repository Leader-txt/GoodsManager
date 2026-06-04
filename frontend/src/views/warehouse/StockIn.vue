<template>
  <div class="stock-in-page">
    <h2>商品入库</h2>
    <el-card class="form-card">
      <el-alert v-if="errMsg" :title="errMsg" type="error" show-icon :closable="false" style="margin-bottom: 16px" />
      <el-alert v-if="successMsg" :title="successMsg" type="success" show-icon :closable="false" style="margin-bottom: 16px" />

      <el-form :model="form" label-width="100px">
        <el-form-item label="商品" required>
          <el-select
            v-model="selectedProductId"
            filterable
            remote
            :remote-method="onProductSearch"
            :loading="prodSearching"
            placeholder="输入商品名称搜索..."
            style="width: 100%"
            @change="onProductSelect"
          >
            <el-option v-for="p in productResults" :key="p.id" :label="`${p.name} (${p.category}) — ${formatPrice(p.price)}`" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标货架" required>
          <el-select v-model="form.shelfId" placeholder="请选择货架" style="width: 100%">
            <el-option v-for="s in shelves" :key="s.id" :label="`${s.shelf_code} — ${s.description}`" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="入库数量" required>
          <el-input-number v-model="form.quantity" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" placeholder="如：总部供货（选填）" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting" style="width: 100%">确认入库</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { stockIn } from '@/api/inventory';
import { getProducts } from '@/api/product';
import { getShelves } from '@/api/inventory';
import { formatPrice } from '@/utils/format';

const router = useRouter();
const errMsg = ref('');
const successMsg = ref('');
const submitting = ref(false);
const form = reactive({ shelfId: '', quantity: 1, remark: '' });
const shelves = ref([]);
const selectedProductId = ref(null);
const selectedProduct = ref(null);
const productResults = ref([]);
const prodSearching = ref(false);
let searchTimer = null;

function onProductSearch(query) {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    if (!query.trim()) { productResults.value = []; return; }
    prodSearching.value = true;
    try {
      const res = await getProducts({ keyword: query.trim(), pageSize: 10 });
      if (res.code === 200) productResults.value = res.data.list;
    } catch { /* ignore */ }
    finally { prodSearching.value = false; }
  }, 300);
}

function onProductSelect(val) {
  selectedProduct.value = productResults.value.find(p => p.id === val);
}

async function handleSubmit() {
  errMsg.value = '';
  successMsg.value = '';
  if (!selectedProduct.value) { errMsg.value = '请选择商品'; return; }
  if (!form.shelfId) { errMsg.value = '请选择目标货架'; return; }
  if (!form.quantity || form.quantity < 1) { errMsg.value = '入库数量必须大于0'; return; }

  submitting.value = true;
  try {
    const res = await stockIn({
      productId: selectedProduct.value.id, shelfId: form.shelfId, quantity: form.quantity, remark: form.remark,
    });
    if (res.code === 200) {
      successMsg.value = '入库成功！';
      setTimeout(() => router.push('/warehouse'), 1000);
    } else { errMsg.value = res.message || '入库失败'; }
  } catch (err) { errMsg.value = err.message || '操作失败'; }
  finally { submitting.value = false; }
}

onMounted(async () => {
  try {
    const res = await getShelves({ pageSize: 100 });
    if (res.code === 200) shelves.value = res.data.list;
  } catch { /* ignore */ }
});
</script>

<style scoped>
.stock-in-page { max-width: 600px; margin: 0 auto; padding: 24px; }
.stock-in-page h2 { margin-bottom: 20px; }
</style>
