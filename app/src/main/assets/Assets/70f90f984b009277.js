/*
@plugin #plugin
@version 1.0
@author
@link
@desc #desc

@option operation {'enable', 'disable', 'switch'}
@alias #operation {#enable, #disable, #switch}

@lang en
#plugin Switch Health Bar
#desc A Command for Health Bar Plugin
#operation Operation
#enable Enable
#disable Disable
#switch Switch

@lang zh
#plugin 开关生命值条
#desc 生命值条插件的相关指令
#operation 操作
#enable 开启
#disable 关闭
#switch 切换
*/
export default class SwitchHealthBar {
    // 接口属性
    operation;
    call() {
        PluginManager.HealthBar?.[this.operation]();
    }
}
//# sourceMappingURL=%E7%94%9F%E5%91%BD%E5%80%BC%E6%9D%A1.%E6%8C%87%E4%BB%A4.70f90f984b009277.js.map