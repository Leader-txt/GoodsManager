<template>
  <div class="stock-in-page"><h2>商品入库</h2>
    <div class="form-card">
      <div v-if="errMsg" class="err-msg">{{ errMsg }}</div>
      <div v-if="successMsg" class="success-msg">{{ successMsg }}</div>

      <div class="form-group">
        <label>商品 <span class="required">*</span></label>
        <div class="search-wrapper">
          <input v-model="productKeyword" @input="onProductSearch" type="text" placeholder="输入商品名称搜索..." class="search-input" />
          <div v-if="productResults.length && showResults" class="dropdown">
            <div v-for="p in productResults" :key="p.id" class="dropdown-item" @click="selectProduct(p)">
              {{ p.name }} ({{ p.category }}) — {{ formatPrice(p.price) }}
            </div>
          </div>
        </div>
        <div v-if="selectedProduct" class="selected-tag">{{ selectedProduct.name }}</div>
      </div>

      <div class="form-group">
        <label>目标货架 <span class="required">*</span></label>
        <select v-model="form.shelfId" class="select-full">
          <option value="">请选择货架</option>
          <option v-for="s in shelves" :key="s.id" :value="s.id">{{ s.shelf_code }} — {{ s.description }}</option>
        </select>
      </div>

      <div class="form-group">
        <label>入库数量 <span class="required">*</span></label>
        <input v-model.number="form.quantity" type="number" min="1" placeholder="请输入入库数量" class="input-full" />
      </div>

      <div class="form-group">
        <label>备注</label>
        <input v-model="form.remark" type="text" placeholder="如：总部供货（选填）" class="input-full" />
      </div>

      <button @click="handleSubmit" :disabled="submitting" class="btn-submit">{{ submitting ? '提交中...' : '确认入库' }}</button>
    </div>
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
const selectedProduct = ref(null);
const productKeyword = ref('');
const productResults = ref([]);
const showResults = ref(false);
let searchTimer = null;

function onProductSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    if (!productKeyword.value.trim()) { productResults.value = []; showResults.value = false; return; }
    try {
      const res = await getProducts({ keyword: productKeyword.value.trim(), pageSize: 10 });
      if (res.code === 200) {
        productResults.value = res.data.list;
        showResults.value = true;
      }
    } catch { /* ignore */ }
  }, 300);
}

function selectProduct(p) {
  selectedProduct.value = p;
  productKeyword.value = p.name;
  showResults.value = false;
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
      productId: selectedProduct.value.id,
      shelfId: form.shelfId,
      quantity: form.quantity,
      remark: form.remark,
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
.form-card { background: #fff; padding: 24px; border-radius: 8px; }
.err-msg { background: #fff2f0; color: #ff4d4f; padding: 10px 14px; border-radius: 4px; margin-bottom: 16px; font-size: 13px; border: 1px solid #ffccc7; }
.success-msg { background: #f6ffed; color: #52c41a; padding: 10px 14px; border-radius: 4px; margin-bottom: 16px; font-size: 13px; border: 1px solid #b7eb8f; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 6px; font-size: 14px; color: #333; }
.required { color: #ff4d4f; }
.search-wrapper { position: relative; }
.search-input, .input-full, .select-full { width: 100%; padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 14px; box-sizing: border-box; }
.search-input:focus, .input-full:focus, .select-full:focus { border-color: #1890ff; outline: none; }
.dropdown { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #d9d9d9; border-radius: 4px; max-height: 200px; overflow-y: auto; z-index: 10; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.dropdown-item { padding: 8px 12px; cursor: pointer; font-size: 13px; border-bottom: 1px solid #f5f5f5; }
.dropdown-item:hover { background: #e6f7ff; }
.selected-tag { margin-top: 6px; padding: 4px 10px; background: #e6f7ff; color: #1890ff; border-radius: 4px; font-size: 13px; display: inline-block; }
.btn-submit { width: 100%; padding: 10px; background: #1890ff; color: #fff; border: none; border-radius: 4px; font-size: 15px; margin-top: 8px; }
.btn-submit:hover { background: #40a9ff; }
.btn-submit:disabled { background: #ccc; }
</style>
