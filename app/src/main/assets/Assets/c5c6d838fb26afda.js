/*
@plugin #plugin
@version 1.0
@author
@link
@desc #desc

@lang en
#plugin Trigger - Bind Caster
#desc Always in the same position as the skill casting actor

@lang zh
#plugin 触发器 - 绑定技能施放角色
#desc 总是和技能施放角色处于同一个位置
*/
export default class Trigger_BindActor {
    trigger;
    constructor(trigger) {
        this.trigger = trigger;
    }
    update() {
        const trigger = this.trigger;
        const caster = trigger.caster;
        if (caster) {
            trigger.x = caster.x;
            trigger.y = caster.y;
        }
    }
}
//# sourceMappingURL=%E8%A7%A6%E5%8F%91%E5%99%A8_%E7%BB%91%E5%AE%9A%E6%96%BD%E6%94%BE%E8%A7%92%E8%89%B2.c5c6d838fb26afda.js.map