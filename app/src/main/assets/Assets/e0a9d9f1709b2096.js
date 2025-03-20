/*
@plugin #plugin
@version
@author
@link
@desc #desc

@number period
@alias #period
@clamp 200 4000
@default 640

@number opacity
@alias #opacity
@clamp 0 1
@default 0.5

@lang en
#plugin Button - Hover Image Transition
#desc Fade in and out when this button is selected in the latest focus.
#period Period(ms)
#opacity Opacity

@lang zh
#plugin 按钮 - 选中图片渐变
#desc 当这个按钮在最新的焦点中被选中时，淡入和淡出选中图片。
#period 周期(ms)
#opacity 不透明度
*/
export default class Button_Transition {
    // 接口属性
    period;
    opacity;
    // 脚本属性
    button;
    state = 'normal';
    elapsed = 0;
    opacityFactor = 1;
    onStart(element) {
        if (element instanceof ButtonElement) {
            this.button = element;
        }
        else {
            this.update = Function.empty;
        }
    }
    update(deltaTime) {
        const state = this.button.activeMode;
        if (this.state !== state) {
            this.state = state;
            if (state !== 'hover') {
                this.elapsed = 0;
            }
            this.opacityFactor = 1;
            this.button.shadowImage.set({ opacity: this.button.imageOpacity });
        }
        if (state === 'hover') {
            const focuses = UI.focuses;
            const focus = focuses[focuses.length - 1];
            if (focus?.contains(this.button)) {
                const period = this.period;
                const opacity = this.opacity;
                const half = period / 2;
                const elapsed = (this.elapsed + deltaTime) % period;
                this.opacityFactor = Math.abs(elapsed - half) / half * (1 - opacity) + opacity;
                this.button.shadowImage.set({ opacity: this.button.imageOpacity * this.opacityFactor });
                this.elapsed = elapsed;
            }
            else if (this.opacityFactor !== 1) {
                this.opacityFactor = 1;
                this.button.shadowImage.set({ opacity: this.button.imageOpacity });
                this.elapsed = 0;
            }
        }
    }
}
//# sourceMappingURL=%E6%8C%89%E9%92%AE_%E9%80%89%E4%B8%AD%E5%9B%BE%E7%89%87%E6%B8%90%E5%8F%98.e0a9d9f1709b2096.js.map