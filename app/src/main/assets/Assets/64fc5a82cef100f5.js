/*
@plugin #plugin
@version 1.0
@author
@link
@desc #desc

@option operation {'enable', 'disable', 'switch'}
@alias #operation {#enable, #disable, #switch}

@lang en
#plugin Switch Movement Path
#desc A Command for Movement Path Plugin
#operation Operation
#enable Enable
#disable Disable
#switch Switch

@lang zh
#plugin 开关移动路径
#desc 移动路径插件的相关指令
#operation 操作
#enable 开启
#disable 关闭
#switch 切换
*/
export default class SwitchMovementPath {
    // 接口属性
    operation;
    call() {
        PluginManager.MovementPath?.[this.operation]();
    }
}
//# sourceMappingURL=%E7%A7%BB%E5%8A%A8%E8%B7%AF%E5%BE%84.%E6%8C%87%E4%BB%A4.64fc5a82cef100f5.js.map