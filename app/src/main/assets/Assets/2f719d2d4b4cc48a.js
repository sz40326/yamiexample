/*
@plugin #plugin
@version 1.0
@author
@link
@desc #desc

@number red
@alias #red
@clamp -255 255
@decimals 0
@default 100

@number green
@alias #green
@clamp -255 255
@decimals 0
@default 100

@number blue
@alias #blue
@clamp -255 255
@decimals 0
@default 100

@number gray
@alias #gray
@clamp 0 255
@decimals 0
@default 0

@easing easingId
@alias #easingId

@number duration
@alias #duration
@default 200

@lang en
#plugin Flash Effect
#desc
Used to show the effect of damage to the actor

Methods:
PluginManager.FlashEffect.flash(actor)

#red Tint - Red
#green Tint - Green
#blue Tint - Blue
#gray Tint - Gray
#easingId Easing
#duration Duration(ms)

@lang zh
#plugin 闪光效果
#desc
用来表现角色受到伤害的效果

脚本方法:
PluginManager.FlashEffect.flash(actor)

#red 色调 - 红
#green 色调 - 绿
#blue 色调 - 蓝
#gray 色调 - 灰
#easingId 渐出方式
#duration 持续时间(毫秒)
*/
const Tint = [0, 0, 0, 0];
let Red = 0;
let Green = 0;
let Blue = 0;
let Gray = 0;
let TintEasing;
let Duration = 0;
// 返回闪光效果类
export default class FlashEffect {
    // 接口属性
    red;
    green;
    blue;
    gray;
    easingId;
    duration;
    onStart() {
        // 设置参数到外部变量
        Red = this.red;
        Green = this.green;
        Blue = this.blue;
        Gray = this.gray;
        TintEasing = Easing.get(this.easingId);
        Duration = this.duration;
        Tint[0] = Red;
        Tint[1] = Green;
        Tint[2] = Blue;
        Tint[3] = Gray;
    }
    /**
     * 添加闪光效果
     * @param actor 目标角色
     */
    flash(actor) {
        const { x, y } = Scene.convert(actor);
        if (x >= Camera.animationLeft &&
            y >= Camera.animationTop &&
            x < Camera.animationRight &&
            y < Camera.animationBottom &&
            actor.animation !== null) {
            const { updaters, animation } = actor;
            const updater = updaters.get('flashEffect');
            let elapsed = 0;
            let tint;
            if (updater) {
                tint = updater.tint;
            }
            else {
                tint = [...Tint];
                animation.tints.push(tint);
            }
            updaters.set('flashEffect', {
                tint,
                protected: true,
                update: deltaTime => {
                    elapsed += deltaTime;
                    const time = TintEasing.get(elapsed / Duration);
                    const reverse = 1 - time;
                    tint[0] = Red * reverse;
                    tint[1] = Green * reverse;
                    tint[2] = Blue * reverse;
                    tint[3] = Gray * reverse;
                    if (elapsed >= Duration) {
                        updaters.deleteDelay('flashEffect');
                    }
                }
            });
        }
    }
}
//# sourceMappingURL=%E9%97%AA%E5%85%89%E6%95%88%E6%9E%9C.2f719d2d4b4cc48a.js.map