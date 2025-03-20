/*
@plugin #plugin
@version 1.0
@author
@link
@desc #desc

@option operation {
  'output-text',
  'output-local',
  'output-variable',
  'output-actor',
  'output-skill',
  'output-state',
  'output-equipment',
  'output-item',
  'output-element',
}
@alias #operation {
  #output-text,
  #output-local,
  #output-variable,
  #output-actor,
  #output-skill,
  #output-state,
  #output-equipment,
  #output-item,
  #output-element,
}

@string text
@alias #text
@cond operation {'output-text'}

@variable-getter variable
@alias #variable
@cond operation {'output-variable'}

@actor-getter actor
@alias #actor
@cond operation {'output-actor'}

@option actorData {'instance', 'attributes', 'attribute'}
@alias #output {#output-instance, #output-attributes, #output-attribute}
@cond operation {'output-actor'}

@attribute-key actorAttr
@alias #attribute
@filter actor
@cond actorData {'attribute'}

@skill-getter skill
@alias #skill
@cond operation {'output-skill'}

@option skillData {'instance', 'attributes', 'attribute'}
@alias #output {#output-instance, #output-attributes, #output-attribute}
@cond operation {'output-skill'}

@attribute-key skillAttr
@alias #attribute
@filter skill
@cond skillData {'attribute'}

@state-getter state
@alias #state
@cond operation {'output-state'}

@option stateData {'instance', 'attributes', 'attribute'}
@alias #output {#output-instance, #output-attributes, #output-attribute}
@cond operation {'output-state'}

@attribute-key stateAttr
@alias #attribute
@filter state
@cond stateData {'attribute'}

@equipment-getter equipment
@alias #equipment
@cond operation {'output-equipment'}

@option equipmentData {'instance', 'attributes', 'attribute'}
@alias #output {#output-instance, #output-attributes, #output-attribute}
@cond operation {'output-equipment'}

@attribute-key equipmentAttr
@alias #attribute
@filter equipment
@cond equipmentData {'attribute'}

@item-getter item
@alias #item
@cond operation {'output-item'}

@option itemData {'instance', 'attributes', 'attribute'}
@alias #output {#output-instance, #output-attributes, #output-attribute}
@cond operation {'output-item'}

@attribute-key itemAttr
@alias #attribute
@filter item
@cond itemData {'attribute'}

@element-getter element
@alias #element
@cond operation {'output-element'}

@option elementData {'instance', 'attributes', 'attribute'}
@alias #output {#output-instance, #output-attributes, #output-attribute}
@cond operation {'output-element'}

@attribute-key elementAttr
@alias #attribute
@filter element
@cond elementData {'attribute'}

@lang en
#plugin Debug
#desc Output variable information for inspection
#operation Operation
#output-text Output (Text)
#output-local Output (All local variables)
#output-variable Output (variable)
#output-actor Output (Actor data)
#output-skill Output (Skill data)
#output-state Output (State data)
#output-equipment Output (Equipment data)
#output-item Output (Item data)
#output-element Output (Element data)
#text Text
#key Key
#variable Variable
#output Output
#output-instance Instance
#output-attributes All attributes
#output-attribute Specific attribute
#attribute Attribute
#actor Actor
#skill Skill
#state State
#equipment Equipment
#item Item
#element Element

@lang zh
#plugin 调试
#desc 输出变量信息以供检查
#operation 操作
#output-text 输出(文本)
#output-local 输出(所有本地变量)
#output-variable 输出(指定变量)
#output-actor 输出(角色数据)
#output-skill 输出(技能数据)
#output-state 输出(状态数据)
#output-equipment 输出(装备数据)
#output-item 输出(物品数据)
#output-element 输出(元素数据)
#text 文本
#key 键
#variable 变量
#output 输出
#output-instance 实例
#output-attributes 所有属性
#output-attribute 指定属性
#attribute 属性
#actor 角色
#skill 技能
#state 状态
#equipment 装备
#item 物品
#element 元素
*/
export default class Debug {
    // 接口属性
    operation;
    text;
    variable;
    actor;
    actorData;
    actorAttr;
    skill;
    skillData;
    skillAttr;
    state;
    stateData;
    stateAttr;
    equipment;
    equipmentData;
    equipmentAttr;
    item;
    itemData;
    itemAttr;
    element;
    elementData;
    elementAttr;
    call() {
        if (!Stats.debug) {
            return;
        }
        // 打开开发者工具窗口
        if (this.operation.includes('output')) {
            require('electron').ipcRenderer.send('open-devTools');
        }
        // 调试操作分支
        switch (this.operation) {
            case 'output-text':
                return console.log(this.text);
            case 'output-local':
                return console.log(CurrentEvent.attributes);
            case 'output-variable':
                return console.log(this.variable);
            case 'output-actor':
                return this.outputObjectData(this.actor, this.actorData, this.actorAttr);
            case 'output-skill':
                return this.outputObjectData(this.skill, this.skillData, this.skillAttr);
            case 'output-state':
                return this.outputObjectData(this.state, this.stateData, this.stateAttr);
            case 'output-equipment':
                return this.outputObjectData(this.equipment, this.equipmentData, this.equipmentAttr);
            case 'output-item':
                return this.outputObjectData(this.item, this.itemData, this.itemAttr);
            case 'output-element':
                return this.outputObjectData(this.element, this.elementData, this.elementAttr);
        }
    }
    /**
     * 输出对象数据
     * @param object 对象实例
     * @param outputData 输出数据
     * @param attrKey 属性键
     */
    outputObjectData(object, outputData, attrKey) {
        switch (outputData) {
            case 'instance':
                return console.log(object);
            case 'attributes':
                return console.log(object?.attributes);
            case 'attribute':
                return console.log(object?.attributes?.[attrKey]);
        }
    }
}
//# sourceMappingURL=%E8%B0%83%E8%AF%95.%E6%8C%87%E4%BB%A4.ab2766d247b75dbf.js.map