/*
@plugin #plugin
@version 1.0
@author
@link
@desc #desc

@option operation {'enable', 'disable', 'talk'}
@alias #operation {#enable, #disable, #talk}

@position-getter position
@alias #position
@cond operation {'talk'}

@variable-setter result
@alias #result
@desc #result-desc
@cond operation {'talk'}

@lang en
#plugin Dialogue System
#desc A Command for Dialogue System Plugin
#operation Operation
#enable Enable
#disable Disable
#talk Talk to an Actor
#position Target Position
#result Result Variable
#result-desc
true: succeeded
false: failed

@lang zh
#plugin 对话系统
#desc 对话系统插件的相关指令
#operation 操作
#enable 启用
#disable 禁用
#talk 搜寻角色并触发对话事件
#position 目标位置
#result 返回结果变量
#result-desc
true: 成功
false: 失败
*/
export default class DialogueSystem {
    // 接口属性
    operation;
    position;
    result;
    call() {
        switch (this.operation) {
            case 'enable':
            case 'disable':
                PluginManager.DialogueSystem?.[this.operation]();
                break;
            case 'talk':
                if (this.position) {
                    const { x, y } = this.position;
                    if (typeof x === 'number' && typeof y === 'number') {
                        const succeeded = !!PluginManager.DialogueSystem?.talk(x, y);
                        this.result?.set(succeeded);
                    }
                }
                break;
        }
    }
}
//# sourceMappingURL=%E5%AF%B9%E8%AF%9D%E7%B3%BB%E7%BB%9F.%E6%8C%87%E4%BB%A4.ed78b4463988fe8a.js.map