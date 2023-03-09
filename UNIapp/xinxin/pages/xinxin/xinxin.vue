<template>
	<view>
		<scroll-view scroll-x="true" enable-flex="true" class="scroll-view_H">
			<view class="item" v-for="(item, index) in list" :key='index'>{{item.name}}</view>
		</scroll-view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				list: [{
					name: '心心'
				}, {
					name: '渣渣'
				}, {
					name: '皮皮'
				}, {
					name: '遥控器'
				}]
			}
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
				} = event.detail
				console.log(scrollLeft, scrollTop, scrollHeight, scrollWidth, deltaX, deltaY);
			}

		}
	}
</script>

<style>
	.scroll-view_H {
		white-space: nowrap;
		justify-content: space-between;
		align-items: center;
	}

	.item {
		width: 33%;
		height: 50rpx;
		border-radius: 20rpx;
		display: inline-block;
		box-sizing: border-box;
		background: Silver;
		margin: 0 5rpx;
		text-align: center;
	}
</style>
