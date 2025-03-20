/*
@plugin #plugin
@version 1.0
@author
@link
@desc #desc

@attribute-key currentKey
@alias #currentKey
@desc #currentKey-desc
@filter actor
@default 'health'

@attribute-key maximumKey
@alias #maximumKey
@desc #maximumKey-desc
@filter actor
@default 'maxHealth'

@attribute-key speedKey
@alias #speedKey
@desc #speedKey-desc
@filter actor
@default 'healthRegen'

@lang en
#plugin Actor - Charger
#desc Regenerate the numeric attribute for an actor
#currentKey Target Attribute
#currentKey-desc This attribute will automatically increase every frame
#maximumKey Maximum Attribute
#maximumKey-desc Limits the maximum value of the target attribute
#speedKey Charging Speed
#speedKey-desc Determines the amount of increase per second

@lang zh
#plugin 角色 - 充电宝
#desc 自动恢复角色的一项数值属性
#currentKey 目标属性
#currentKey-desc 属性值每帧会自动增加
#maximumKey 最大值属性
#maximumKey-desc 限制目标属性的上限
#speedKey 充电速度
#speedKey-desc 每秒的增加量
*/
export default class Actor_Charger {
    // 接口属性
    currentKey;
    maximumKey;
    speedKey;
    // 脚本属性
    actor;
    constructor(actor) {
        this.actor = actor;
    }
    update(deltaTime) {
        const { actor } = this;
        if (actor.active) {
            const { attributes } = actor;
            const target = attributes[this.currentKey];
            const maximum = attributes[this.maximumKey];
            const speed = attributes[this.speedKey];
            if (typeof target === 'number' &&
                typeof maximum === 'number' &&
                typeof speed === 'number' &&
                speed > 0 && target < maximum) {
                attributes[this.currentKey] =
                    Math.min(target + speed * deltaTime / 1000, maximum);
            }
        }
    }
}
//# sourceMappingURL=%E8%A7%92%E8%89%B2_%E5%85%85%E7%94%B5%E5%AE%9D.f8d98d5c407a7b96.js.map