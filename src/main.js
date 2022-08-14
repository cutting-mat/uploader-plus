import { createApp } from 'vue'

import App from './test/Index.vue'
const app = createApp(App)
// UI库
import ElementPlus from 'element-plus'
import 'element-plus/theme-chalk/index.css'
app.use(ElementPlus);

// 全局样式
import '@/test/assets/global.css';

import uploader from "@/index";
import uploadConfig from "@/upload.config"
app.use(uploader, uploadConfig);

app.mount('#app')
