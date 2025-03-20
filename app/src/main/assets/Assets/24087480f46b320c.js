/*
@plugin #plugin
@version 1.0
@author
@link
@desc #desc

@option operation {'enable', 'disable', 'switch'}
@alias #operation {#enable, #disable, #switch}

@lang en
#plugin Switch Trigger Shape Renderer
#desc A Command for Trigger Shape Renderer Plugin
#operation Operation
#enable Enable
#disable Disable
#switch Switch

@lang zh
#plugin 开关触发器形状渲染
#desc 触发器形状渲染器插件的相关指令
#operation 操作
#enable 开启
#disable 关闭
#switch 切换
*/
export default class SwitchTriggerShapeRenderer {
    // 接口属性
    operation;
    call() {
        PluginManager.TriggerShapeRenderer?.[this.operation]();
    }
}
//# sourceMappingURL=%E8%A7%A6%E5%8F%91%E5%99%A8%E5%BD%A2%E7%8A%B6%E6%B8%B2%E6%9F%93%E5%99%A8.%E6%8C%87%E4%BB%A4.24087480f46b320c.js.map