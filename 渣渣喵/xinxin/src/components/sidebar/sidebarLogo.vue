<template>
  <div class="iconTitle">
    <img src="public/icon.png" alt="" class="icon" />
    <span class="title">渣渣喵的一家</span>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
.iconTitle {
  height: 10%;
  background: red;
  display: flex;
  align-items: center;
  justify-content: center;

  .title {
    display: inline-block;
  }
  .icon {
    width: 20%;
    padding-right: 6%;
    display: inline-block;
  }
}
</style>
