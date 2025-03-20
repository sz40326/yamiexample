/*
@plugin #plugin
@version 1.1
@author
@link
@desc #desc

@option actor {'trigger', 'local', 'global'}
@alias #actor {#actor-trigger, #actor-local, #actor-global}

@string localActorKey
@alias #localActorKey
@cond actor {'local'}

@variable globalActorKey
@alias #globalActorKey
@cond actor {'global'}

@option type {'item', 'equipment'}
@alias #type {#type-item, #type-equipment}

@file itemId
@alias #itemId
@filter item
@cond type {'item'}

@file equipmentId
@alias #equipmentId
@filter equipment
@cond type {'equipment'}

@number min
@alias #min
@clamp 1 1000000000
@decimals 0
@default 1
@cond type {'item'}

@number max
@alias #max
@clamp 1 1000000000
@decimals 0
@default 1
@cond type {'item'}

@variable-number dropRate
@alias #dropRate
@clamp 0 1
@default 1

@lang en
#plugin Drop Item
#desc A command related to the drop item plugin
#actor Target Actor
#actor-trigger Event Trigger Actor
#actor-local Local Actor Variable
#actor-global Global Actor Variable
#localActorKey Actor Key
#globalActorKey Actor
#type Type
#type-item Item
#type-equipment Equipment
#itemId Item
#equipmentId Equipment
#min Min Quantity
#max Max Quantity
#dropRate Drop Rate

@lang zh
#plugin 掉落物品
#desc 掉落物品插件的相关指令
#actor 目标角色
#actor-trigger 事件触发角色
#actor-local 本地角色变量
#actor-global 全局角色变量
#localActorKey 角色变量
#globalActorKey 角色变量
#type 类型
#type-item 物品
#type-equipment 装备
#itemId 物品
#equipmentId 装备
#min 最小数量
#max 最大数量
#dropRate 掉落几率
*/
export default class DropItem {
    // 接口属性
    actor;
    localActorKey;
    globalActorKey;
    type;
    itemId;
    equipmentId;
    min;
    max;
    dropRate;
    call() {
        if (this.dropRate === 1 || Math.random() < this.dropRate) {
            let actor;
            switch (this.actor) {
                case 'trigger':
                    actor = CurrentEvent.triggerActor;
                    break;
                case 'local':
                    actor = CurrentEvent.attributes[this.localActorKey];
                    break;
                case 'global':
                    actor = Variable.get(this.globalActorKey);
                    break;
            }
            if (actor instanceof Actor) {
                let item;
                switch (this.type) {
                    case 'item': {
                        const data = Data.items[this.itemId];
                        if (data) {
                            item = new Item(data);
                            item.quantity = Math.randomInt(this.min, this.max);
                        }
                        break;
                    }
                    case 'equipment': {
                        const data = Data.equipments[this.equipmentId];
                        if (data) {
                            item = new Equipment(data);
                        }
                        break;
                    }
                }
                if (item) {
                    PluginManager.DropItem?.drop(actor, item);
                }
            }
        }
    }
}
//# sourceMappingURL=%E6%8E%89%E8%90%BD%E7%89%A9%E5%93%81.%E6%8C%87%E4%BB%A4.249c9c9d4de177c9.js.map