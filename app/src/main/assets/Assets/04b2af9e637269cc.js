/*
@plugin #plugin
@version
@author
@link
@desc

@number sensitivity
@alias #sensitivity
@clamp 10 500
@default 64

@lang en
#plugin Vertical Scroll Bar
#sensitivity Sensitivity

#lang zh
#plugin 垂直滚动条
#sensitivity 灵敏度

*/
export default class MainScript {
    sensitivity;
    scrollY = -1;
    scrollHeight = -1;
    gridWindow;
    scrollBar;
    scrollBarTrack;
    scrollBarThumb;
    decrementButton;
    incrementButton;
    onStart(element) {
        this.decrementButton = element.query('presetId', 'e1168760e27e0de1');
        this.incrementButton = element.query('presetId', 'af0afec479d14156');
        this.scrollBarTrack = element.query('presetId', 'b0c551937dd55aa9');
        this.scrollBarThumb = element.query('presetId', '4a1ba16b81eb1a75');
        if (this.decrementButton instanceof UIElement &&
            this.incrementButton instanceof UIElement &&
            this.scrollBarTrack instanceof UIElement &&
            this.scrollBarThumb instanceof UIElement) {
            this.scrollBar = element;
            this.findGridWindow();
            this.decrementButton.script.add(new ScrollButtonScript(this, -this.sensitivity));
            this.incrementButton.script.add(new ScrollButtonScript(this, this.sensitivity));
            this.scrollBarThumb.script.add(new ScrollThumbScript(this));
        }
        else {
            this.update = Function.empty;
        }
    }
    findGridWindow() {
        for (const element of this.scrollBar.parent.children) {
            if (element instanceof WindowElement) {
                element.script.add(new WindowMouseWheelScript(this));
                this.gridWindow = element;
            }
        }
    }
    update() {
        if (this.scrollY !== this.gridWindow.scrollY || this.scrollHeight !== this.gridWindow.scrollHeight) {
            this.scrollY = this.gridWindow.scrollY;
            this.scrollHeight = this.gridWindow.scrollHeight;
            this.resizeScrollBar();
        }
    }
    /** 重新调整滚动条 */
    resizeScrollBar() {
        const ratioY = this.gridWindow.scrollY / this.gridWindow.scrollHeight;
        const ratioH = this.gridWindow.height / this.gridWindow.scrollHeight;
        if (ratioH >= 1) {
            this.scrollBar.hide();
            return;
        }
        this.scrollBarThumb.set({
            y: ratioY * this.scrollBarTrack.height,
            height: ratioH * this.scrollBarTrack.height,
        });
        this.scrollBar.show();
    }
}
// 滚动按钮脚本
class ScrollButtonScript {
    manager;
    sensitivity;
    constructor(manager, sensitivity) {
        this.manager = manager;
        this.sensitivity = sensitivity;
    }
    onMouseDownLB() {
        this.manager.gridWindow.scrollY += this.sensitivity;
    }
}
// 滚动滑块脚本
class ScrollThumbScript {
    gridWindow;
    scrollBarTrack;
    mouseDownY;
    startScrollY;
    constructor(manager) {
        this.gridWindow = manager.gridWindow;
        this.scrollBarTrack = manager.scrollBarTrack;
        this.mouseDownY = 0;
        this.startScrollY = 0;
    }
    onDestroy() {
        // 释放拖拽状态
        this.windowOnMouseUpLB();
    }
    onMouseDownLB() {
        this.mouseDownY = Mouse.screenY;
        this.startScrollY = this.gridWindow.scrollY;
        Input.on('mousemove', this.windowOnMouseMove, true);
        Input.on('mouseupLB', this.windowOnMouseUpLB, true);
    }
    windowOnMouseUpLB = () => {
        Input.off('mousemove', this.windowOnMouseMove);
        Input.off('mouseupLB', this.windowOnMouseUpLB);
        Input.bubbles.stop();
    };
    windowOnMouseMove = () => {
        const ratioY = this.gridWindow.scrollHeight / this.scrollBarTrack.height;
        const deltaY = (Mouse.screenY - this.mouseDownY) * ratioY;
        this.gridWindow.scrollY = this.startScrollY + deltaY;
    };
}
// 窗口鼠标滚轮脚本
class WindowMouseWheelScript {
    manager;
    scrollTime;
    scrollTargetY;
    constructor(manager) {
        this.manager = manager;
        this.scrollTime = 0;
        this.scrollTargetY = 0;
    }
    onWheel(event) {
        const manager = this.manager;
        const gridWindow = manager.gridWindow;
        const sensitivity = manager.sensitivity;
        const deltaY = event.deltaY;
        if (this.scrollTime <= 0) {
            this.scrollTargetY = gridWindow.scrollY;
        }
        let scrollY = this.scrollTargetY;
        // 向上滚动
        if (deltaY < 0) {
            scrollY = Math.max(scrollY - sensitivity, 0);
        }
        // 向下滚动
        if (deltaY > 0) {
            const maxScrollY = gridWindow.scrollHeight - gridWindow.height;
            scrollY = Math.min(scrollY + sensitivity, maxScrollY);
        }
        // 检查滚动有效性
        if (gridWindow.scrollY !== scrollY) {
            this.scrollTime = 100;
            this.scrollTargetY = scrollY;
        }
    }
    update(deltaTime) {
        if (this.scrollTime > 0) {
            const gridWindow = this.manager.gridWindow;
            const ratioY = Math.min(deltaTime / this.scrollTime, 1);
            const deltaY = (this.scrollTargetY - gridWindow.scrollY) * ratioY;
            if ((this.scrollTime -= deltaTime) <= 0) {
                gridWindow.scrollY = this.scrollTargetY;
            }
            else {
                gridWindow.scrollY += deltaY;
            }
        }
    }
}
//# sourceMappingURL=%E5%9E%82%E7%9B%B4%E6%BB%9A%E5%8A%A8%E6%9D%A1_%E8%84%9A%E6%9C%AC.04b2af9e637269cc.js.map