/*
@plugin #plugin
@version 1.0
@author
@link

@number angularSpeed
@alias #angularSpeed
@clamp -3600 3600
@default 90

@lang en
#plugin Trigger: Rotate Around the Caster
#angularSpeed Angular Speed

@lang zh
#plugin 触发器 - 绕技能施放角色旋转
#angularSpeed 角速度
*/
export default class Trigger_RotateAroundCaster {
    // 接口属性
    angularSpeed;
    // 脚本属性
    trigger;
    caster;
    casterX;
    casterY;
    angularSpeedRadians;
    onStart(trigger) {
        if (trigger instanceof Trigger && trigger.caster instanceof Actor) {
            this.trigger = trigger;
            this.caster = trigger.caster;
            this.casterX = this.caster.x;
            this.casterY = this.caster.y;
            this.angularSpeedRadians = Math.radians(this.angularSpeed) / 1000;
        }
        else {
            this.update = Function.empty;
        }
    }
    update() {
        const trigger = this.trigger;
        const caster = this.caster;
        // 计算相对于上一次角色位置的距离
        const distX = trigger.x - this.casterX;
        const distY = trigger.y - this.casterY;
        const dist = Math.sqrt(distX ** 2 + distY ** 2);
        const delta = this.angularSpeedRadians * trigger.deltaTime;
        const angle = Math.atan2(distY, distX) + delta;
        trigger.x = caster.x + Math.cos(angle) * dist;
        trigger.y = caster.y + Math.sin(angle) * dist;
        this.casterX = caster.x;
        this.casterY = caster.y;
    }
}
//# sourceMappingURL=%E8%A7%A6%E5%8F%91%E5%99%A8_%E7%BB%95%E6%96%BD%E6%94%BE%E8%80%85%E6%97%8B%E8%BD%AC.dff6b51e230af1d3.js.map