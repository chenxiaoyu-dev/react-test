<template>
  <div>ts基础</div>
</template>

<script setup lang="ts">
//1.静态类型（强类型）声明时确定类型，之后不允许修改
//2.TS可处理已有的js 并只对TS代码编译，完善了JS的确定
//3. 开源（社区成熟），跨平台，所有支持的js代码，都可以使用TS
//4.丰富的配置项，强大的开发工具支持

//基础类型
// any 可以赋予任何类型的值
let m: any = 77;
m = "hhhhh";
//number 类型 双精度64位浮点值，可以表示整数和分数
let aa: number = 90;
//string 字符串类型
let str: string = `jjjjj` + "88888";
//Boolean 布尔类型
let flag: Boolean = true;
flag = false;
//数组类型
let arr: number[] = [7, 9, 90, 0];
let person: Array<string | number> = ["jjj", 8];
//远组类型
let l: [string, number, Boolean] = ["zhazha", 888, false];
//void  函数没有返回值
//enum  枚举类型 用于定义数值集合

enum days {
  sun,
  mon = 10,
  tue,
  web,
  thu,
  fri,
  sat,
}
console.log(days.sun);
console.log(days.tue);

//void  无任何类型   用于标识方法返回值的类型  表示该方法没有返回值
//null表示为空   原型链的重点  找不到节点  。。undefined  声明但没有值    转化为数值  null为0，undefined为NaN
//never类型   表示不会出现的值   函数抛出一个异常
// unkonwn   未知类型  自己可以赋值任何类型  但不可以赋值给别人

//类型断言 可以用来手动指定一个值的类型，允许变量从一种类型更改另一种类型
//对象类型
let obj: { name: string; num: number } = {
  name: "渣渣",
  num: 9,
};
let ob: { [num: string]: any; r: number } = {
  numb: "nnn",
  r: 0,
};

// 类型别名
type num = {
  name: string;
  [key: string]: any;
};
//组合类型
let xin: string | number | Boolean;
xin = "渣渣喵";
xin = 88;
xin = false;

//函数参数  必填参数   默认参数  可选参数 +？  剩余参数 使用...  (...result)

//重载允许一个函数接受不同数量或者类型的参数时，作出不同的处理
class Person {
  name: string;
  constructor(n: string) {
    this.name = n;
  }
  sun(): void {
    console.log(this.name);
  }
}
</script>

<style lang="scss" scoped></style>
