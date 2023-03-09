//useRouter  路由实例push   useRoute  路由对象  获取路由携带的参数
import {
  createRouter,
  createWebHistory,
  useRouter,
  RouteRecordRaw,
} from "vue-router"; //createRouter创建路由实例 createWebHistory设置为历史路由
const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: () => import("../views/home.vue"),
  },
  {
    path: "/login",
    component: () => import("../views/login/index.vue"),
  },
  {
    path: "/test",
    component: () => import("../views/test.vue"),
  },
];
const Router = createRouter({
  history: createWebHistory(),
  routes,
});
export default Router;
