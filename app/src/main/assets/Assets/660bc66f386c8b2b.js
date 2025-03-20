/*
@plugin 移动端-轮盘
@version 1.0
@author 徐然
@link https://space.bilibili.com/291565199
@desc

@element-id Roulette
@alias 轮盘ID

@easing RouletteEasing
@alias 移动轮盘曲线


*/
/** 插件脚本 */
export default class Mobile_Roulette {
    Roulette; // 轮盘ID
    RouletteEasing; // 轮盘ID
    Active; // 是否激活
    constructor() {
        this.Roulette = "";
        this.RouletteEasing = "";
        this.Active = false;
        Scene.on("load", (event) => {
            const elem = UI.get(this.Roulette);
            if (elem) {
                const parentTrans = elem.transform;
                const point = elem.children[0];
                const childTrans = point.transform;
                // console.log(parentTrans, childTrans);
                Input.on("touchstart", (event) => {
                    const touches = event.touches;
                    const find = UI.find(UI.root.children, touches[0].screenX, touches[0].screenY);
                    if (touches.length && (find === elem || find == point))
                        this.Active = true;
                }, true);
                Input.on("touchend", () => {
                    this.Active = false;
                }, true);
                Input.on("touchmove", (event) => {
                    const touches = event.touches;
                    if (touches.length && this.Active) {
                        console.log(point.transform);
                        point.move({
                            x: touches[0].screenX,
                            y: touches[0].screenY,
                        }, this.RouletteEasing, 1);
                    }
                }, true);
            }
        });
    }
}
//# sourceMappingURL=%E7%A7%BB%E5%8A%A8%E7%AB%AF-%E8%BD%AE%E7%9B%98.660bc66f386c8b2b.js.map