/*
@plugin #plugin
@version 1.0
@author
@link
@desc #desc

@actor-getter actor
@alias #actor

@option style {0, 1, 2, 3, 4, 5}
@alias #style

@variable-number damage
@alias #damage

@lang en
#plugin Popup Damage Number
#desc A Command for Damage Number Plugin
#actor Target Actor
#style Style
#damage Damage Value

@lang zh
#plugin 弹出伤害数字
#desc 伤害数字插件的相关指令
#actor 目标角色
#style 样式
#damage 伤害值
*/
export default class PopupDamageNumber {
    actor;
    style;
    damage;
    call() {
        if (this.actor && typeof this.damage === 'number') {
            PluginManager.DamageNumber?.popup(this.actor, this.style, this.damage);
        }
    }
}
//# sourceMappingURL=%E4%BC%A4%E5%AE%B3%E6%95%B0%E5%AD%97.%E6%8C%87%E4%BB%A4.5fda2218f2770caf.js.map