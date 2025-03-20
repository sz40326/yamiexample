/*
@plugin #plugin
@version 1.0
@author
@link
@desc #desc

@option actor {'trigger', 'caster', 'local', 'global'}
@alias #actor {#actor-trigger, #actor-caster, #actor-local, #actor-global}

@string localActorKey
@alias #localActorKey
@cond actor {'local'}

@variable globalActorKey
@alias #globalActorKey
@cond actor {'global'}

@lang en
#plugin Play Flash Effect
#desc A Command for Flash Effect Plugin
#actor Target Actor
#actor-trigger Trigger Actor
#actor-caster Skill Caster
#actor-local Local Variable
#actor-global Global Variable
#localActorKey Actor Variable
#globalActorKey Actor Variable

@lang zh
#plugin 播放闪光效果
#desc 闪光效果插件的相关指令
#actor 目标角色
#actor-trigger 事件触发角色
#actor-caster 技能施放角色
#actor-local 本地角色变量
#actor-global 全局角色变量
#localActorKey 角色变量
#globalActorKey 角色变量
*/
export default class PlayFlashEffect {
    // 接口属性
    actor;
    localActorKey;
    globalActorKey;
    call() {
        let actor;
        switch (this.actor) {
            case 'trigger':
                actor = CurrentEvent.triggerActor;
                break;
            case 'caster':
                actor = CurrentEvent.casterActor;
                break;
            case 'local':
                actor = CurrentEvent.attributes[this.localActorKey];
                break;
            case 'global':
                actor = Variable.get(this.globalActorKey);
                break;
        }
        if (actor instanceof Actor) {
            PluginManager.FlashEffect?.flash(actor);
        }
    }
}
//# sourceMappingURL=%E9%97%AA%E5%85%89%E6%95%88%E6%9E%9C.%E6%8C%87%E4%BB%A4.d0570fb007a2bef5.js.map