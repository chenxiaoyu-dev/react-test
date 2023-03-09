import { defineStore } from "pinia";
export const useMainStore = defineStore("main", {
  state: () => {
    return {
      zhazha: "渣渣喵",
    };
  },
  getters: {
    //类似于computed 可以帮我们去修饰我们的值
  },
  //可以操作异步 和 同步提交state
  actions: {
    updateName(zhazha: string) {
      this.zhazha = zhazha;
      console.log(this.zhazha);
    },
  },
   persist: {
        enabled: true,
        strategies: [
            {
                key: 'zhazha',
                storage: localStorage
            }
        ]
    }


});
