"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      list: [{
        name: "心心"
      }, {
        name: "渣渣"
      }, {
        name: "皮皮"
      }, {
        name: "遥控器"
      }]
    };
  },
  methods: {
    scrollChange(event) {
      let {
        scrollLeft,
        scrollTop,
        scrollHeight,
        scrollWidth,
        deltaX,
        deltaY
      } = event.detail;
      console.log(scrollLeft, scrollTop, scrollHeight, scrollWidth, deltaX, deltaY);
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($data.list, (item, index, i0) => {
      return {
        a: common_vendor.t(item.name),
        b: index
      };
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__file", "/Users/xiaoyuchen/Desktop/UNIapp/xinxin/pages/xinxin/xinxin.vue"]]);
wx.createPage(MiniProgramPage);
