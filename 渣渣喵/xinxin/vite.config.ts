import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import AutoImport from "unplugin-auto-import/vite"; //自动引入ref,reactive等等等
import Components from "unplugin-vue-components/vite"; //按需导入 自动导入;
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      //自动引入模块的方法
      imports: [
        "vue",
        "vue-router",
        "pinia",
        {
          axios: [
            ["default", "axios"], // import { default as axios } from 'axios',
          ],
        },
      ],
    }),
  ],
  base: process.env.NODE_ENV === "production" ? "./" : "/", // 设置开发者模式以及生产模式访问路径
  // 静态资源服务文件夹
  publicDir: "public",
  resolve: {
    //配置路径别名
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  css: {
    preprocessorOptions: {
      //配置css预处理器
      scss: {
        charset: false,
      },
    },
  },
  // 测试环境保留打印

  build: {
    target: "modules",
    outDir: "dist", // 指定输出路径
    assetsDir: "static", // 指定生成静态资源的存放路径
    minify: "terser", // 混淆器,terser构建后文件体积更小
    sourcemap: false,
    //打包环境移除console.log，debugger
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除console
        drop_debugger: true, // 生产环境移除debugger
      },
    },
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return id
              .toString()
              .split("node_modules/")[1]
              .split("/")[0]
              .toString();
          }
        },
      },
    },
  },
  server: {
    port: 8080, //指定开发服务器端口：默认3000
    open: false, //启动时自动在浏览器中打开
    // cors: false, //为开发服务器配置 CORS
    proxy: {
      // "/api": {
      //   //配置代理地址
      //   target: "请求的域名地址",
      //   changeOrigin: true, // 是否允许跨域代理
      //   rewrite: (path) => path.replace(/^\/api/, ""), // 重定向地址
    },
  },
});
