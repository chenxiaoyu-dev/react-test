<template>
  <div class="common-layout">
    <el-container>
      <el-aside>
        <AppMenu />
        <!-- 侧边栏 -->
      </el-aside>
      <el-container>
        <el-header>
          <!-- <AppHeader /> -->
          标题栏
        </el-header>
        <el-main>
          <router-view />
          内容
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import AppMenu from "@/components/AppMenu.vue";
</script>

<style lang="scss" scoped>
.common-layout {
  .el-container {
    height: 100vh;
    width: 100%;
    background: rgb(205, 205, 255);
    .el-aside {
      height: 100vh;
      width: 15%;
      background-color: #304156;
      color: #333;
    }
  }
}
</style>
