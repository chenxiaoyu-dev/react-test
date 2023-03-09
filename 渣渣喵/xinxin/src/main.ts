import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import { createPinia } from "pinia"; //状态管理
import piniaPersist from "pinia-plugin-persist"; //永久化插件
import "element-plus/dist/index.css";
import Router from "./router";
const pinia = createPinia();
pinia.use(piniaPersist);
const app = createApp(App);
app.use(pinia); //状态管理挂在到app上
app.use(Router); //路由挂载到app上
app.mount("#app");
console.log(import.meta.env.VITE_API_URL);
