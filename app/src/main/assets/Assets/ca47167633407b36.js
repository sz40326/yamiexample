/*
@plugin #plugin
@version
@author
@link
@desc #desc

@number velocityX
@alias #velocityX
@default 10

@number velocityY
@alias #velocityY
@default 0

@lang en
#plugin Image - Scroll
#desc Automatic image scrolling
#velocityX Velocity X
#velocityY Velocity Y

@lang zh
#plugin 图像 - 滚动效果
#desc 自动滚动图像
#velocityX 水平速度
#velocityY 垂直速度
*/
export default class Image_Scrolling {
    // 接口属性
    velocityX;
    velocityY;
    // 脚本属性
    image;
    onStart(element) {
        if (element instanceof ImageElement) {
            this.image = element;
        }
        else {
            this.update = Function.empty;
        }
    }
    update(deltaTime) {
        this.image.shiftX += this.velocityX * deltaTime / 1000;
        this.image.shiftY += this.velocityY * deltaTime / 1000;
    }
}
//# sourceMappingURL=%E5%9B%BE%E5%83%8F_%E6%BB%9A%E5%8A%A8.ca47167633407b36.js.map