import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import './styles/element-theme.css';
import App from './App.vue';
import router from './router';
import { ElMessage, ElMessageBox } from 'element-plus';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(ElementPlus);

// 全局属性 — 可在组件中通过 this.$message / this.$msgbox 访问
app.config.globalProperties.$message = ElMessage;
app.config.globalProperties.$msgbox = ElMessageBox;

app.mount('#app');
