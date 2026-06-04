import { config } from '@vue/test-utils';
import ElementPlus from 'element-plus';

// Register Element Plus globally for all tests
config.global.plugins = [ElementPlus];

// Mock ElMessage and ElMessageBox since they're imperative
config.global.mocks = {
  $message: {
    success: () => {},
    error: () => {},
    warning: () => {},
    info: () => {},
  },
  $msgbox: {
    confirm: () => Promise.resolve(),
    alert: () => Promise.resolve(),
  },
};
