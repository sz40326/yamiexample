/** ******************************** 独立变量管理器 ******************************** */
let SelfVariable = new class SelfVariableManager {
    /** 独立变量映射表 */
    map = {};
    /** 重置变量值 */
    reset() {
        this.map = {};
    }
    /**
     * 获取变量值
     * @param key 独立变量ID
     * @returns 独立变量值
     */
    get(key) {
        return SelfVariable.map[key];
    }
    /**
     * 设置变量值
     * @param key 变量ID
     * @param value 变量值
     */
    set(key, value) {
        switch (typeof SelfVariable.map[key]) {
            case typeof value:
            case 'undefined':
                SelfVariable.map[key] = value;
                break;
        }
    }
    /**
     * 保存独立变量数据
     * @returns 独立变量存档数据
     */
    saveData() {
        return this.map;
    }
    /**
     * 加载独立变量数据(无法删除旧存档中的无效数据)
     * @param variables 独立变量存档数据
     */
    loadData(variables) {
        this.map = variables;
    }
};
/** ******************************** 全局变量管理器 ******************************** */
let Variable = new class GlobalVariableManager {
    /** 全局变量群组(0:正常 1:共享 2:临时) */
    groups = [[], [], []];
    // 全局变量映射表
    map = {};
    /** 初始化全局变量 */
    initialize() {
        // 解包变量数据
        this.unpack(Data.variables);
        delete Data.variables;
        // 重置变量数据
        this.reset([0, 1, 2]);
        // 加载共享变量
        this.loadData(1, Data.globalData.variables);
    }
    /**
     * 解包变量数据
     * @param items 变量数据列表
     */
    unpack(items) {
        const groups = Variable.groups;
        for (const item of items) {
            if ('children' in item) {
                // 解包文件夹中的变量
                this.unpack(item.children);
            }
            else {
                // 按分类存放变量对象
                groups[item.sort].push(item);
            }
        }
    }
    /**
     * 重置指定群组的变量值
     * @param groupIndices 变量群组索引数组
     */
    reset(groupIndices = [0, 2]) {
        for (const i of groupIndices) {
            for (const item of Variable.groups[i]) {
                // 以ID为键，写入变量值
                Variable.map[item.id] = item.value ?? undefined;
            }
        }
    }
    /**
     * 获取变量值
     * @param key 变量ID
     * @returns 变量值
     */
    get(key) {
        return Variable.map[key];
    }
    /**
     * 设置变量值
     * @param key 变量ID
     * @param value 变量值
     */
    set(key, value) {
        switch (typeof value) {
            case typeof Variable.map[key]:
                Variable.map[key] = value;
                break;
            case 'object':
                if (key in Variable.map && typeof Variable.map[key] === 'undefined') {
                    Variable.map[key] = value;
                }
                break;
            case 'undefined':
                if (typeof Variable.map[key] === 'object') {
                    Variable.map[key] = value;
                }
                break;
        }
    }
    /**
     * 保存全局变量数据
     * @param groupIndex 变量群组索引(0:常规, 1:共享)
     * @returns 变量存档数据
     */
    saveData(groupIndex) {
        const data = {};
        const group = Variable.groups[groupIndex];
        const length = group.length;
        for (let i = 0; i < length; i++) {
            const key = group[i].id;
            data[key] = Variable.map[key];
        }
        return data;
    }
    /**
     * 加载全局变量数据
     * @param groupIndex 变量群组索引(0:常规, 1:共享)
     * @param variables 保存的全局变量数据
     */
    loadData(groupIndex, variables) {
        const group = Variable.groups[groupIndex];
        const length = group.length;
        for (let i = 0; i < length; i++) {
            const item = group[i];
            const key = item.id;
            // 从存档数据中加载变量值
            // 如果类型有效，则写入值
            const value = variables[key];
            const type = typeof item.value;
            if (type === typeof value) {
                Variable.map[key] = value;
            }
        }
    }
};
/** ******************************** 属性管理器 ******************************** */
let Attribute = new class AttributeManager {
    // {属性ID:属性对象}映射表
    idMap = {};
    // {群组ID:属性键:属性名称}映射表
    groupMap = {};
    /** 初始化属性管理器 */
    initialize() {
        this.unpack(Data.attribute.keys, []);
        delete Data.attribute;
    }
    /**
     * 获取属性
     * @param attrId 属性ID
     * @returns 属性对象
     */
    get(attrId) {
        return this.idMap[attrId];
    }
    /**
     * 获取属性名称(未使用)
     * @param attrId 属性ID
     * @returns 属性名称
     */
    getName(attrId) {
        return this.idMap[attrId]?.name ?? '';
    }
    /**
     * 获取属性键
     * @param attrId 属性ID
     * @returns 属性键
     */
    getKey(attrId) {
        return this.idMap[attrId]?.key ?? '';
    }
    /**
     * 获取属性群组
     * @param groupId 群组ID
     * @returns 属性群组
     */
    getGroup(groupId) {
        return this.groupMap[groupId];
    }
    /**
     * 解包属性数据
     * @param items 属性数据列表
     * @param groupKeys 群组ID的栈列表
     */
    unpack(items, groupKeys) {
        for (const item of items) {
            const id = item.id;
            if ('children' in item) {
                // 解包文件夹中的属性
                Attribute.groupMap[id] = new ItemGroup();
                groupKeys.push(id);
                this.unpack(item.children, groupKeys);
                groupKeys.pop();
            }
            else {
                // 构建属性对象映射关系
                this.idMap[id] = item;
                if (item.key === '') {
                    item.key = id;
                }
                // 构建{群组ID:属性键:属性名称}映射表
                for (const key of groupKeys) {
                    Attribute.groupMap[key].set(item.key, item);
                }
            }
        }
    }
    /**
    * 加载属性词条到映射表中
    * @param map 属性映射表
    * @param entries 属性键值对列表
    */
    loadEntries(map, entries) {
        for (const entry of entries) {
            const attr = Attribute.get(entry.key);
            if (attr !== undefined) {
                if (attr.type === 'enum') {
                    const enumstr = Enum.get(entry.value);
                    if (enumstr !== undefined) {
                        map[attr.key] = enumstr.value;
                    }
                }
                else {
                    map[attr.key] = entry.value;
                }
            }
        }
    }
    /**
     * 获取属性
     * @param map 属性映射表
     * @param key 属性键
     * @returns 属性值
     */
    GET = (map, key) => {
        return map[key];
    };
    /**
     * 设置属性
     * @param map 属性映射表
     * @param key 属性键
     * @param value 属性值
     */
    SET = (map, key, value) => {
        map[key] = value;
    };
    /**
     * 删除属性
     * @param map 属性映射表
     * @param key 属性键
     */
    DELETE = (map, key) => {
        delete map[key];
    };
    /**
     * 类型安全 - 设置
     * @param map 属性映射表
     * @param key 属性键
     * @param value 属性值
     */
    SAFE_SET = (map, key, value) => {
        if (Variable.map === map) {
            Variable.set(key, value);
        }
        else
            switch (typeof value) {
                case typeof map[key]:
                    map[key] = value;
                    break;
                case 'boolean':
                case 'number':
                case 'string':
                case 'object':
                    if (typeof map[key] === 'undefined') {
                        map[key] = value;
                    }
                    break;
                case 'undefined':
                    if (typeof map[key] === 'object') {
                        map[key] = value;
                    }
                    break;
            }
    };
    /**
     * 布尔值 - 获取
     * @param map 属性映射表
     * @param key 属性键
     * @returns 布尔值
     */
    BOOLEAN_GET = (map, key) => {
        const value = map[key];
        return typeof value === 'boolean' ? value : undefined;
    };
    /**
     * 布尔值 - 设置
     * @param map 属性映射表
     * @param key 属性键
     * @param value 布尔值
     */
    BOOLEAN_SET = (map, key, value) => {
        switch (typeof map[key]) {
            case 'boolean':
            case 'undefined':
                map[key] = value;
                return;
        }
    };
    /**
     * 布尔值 - 非
     * @param map 属性映射表
     * @param key 属性键
     * @param value 布尔值
     */
    BOOLEAN_NOT = (map, key, value) => {
        if (typeof map[key] === 'boolean') {
            map[key] = !value;
        }
    };
    /**
     * 布尔值 - 与
     * @param map 属性映射表
     * @param key 属性键
     * @param value 布尔值
     */
    BOOLEAN_AND = (map, key, value) => {
        if (typeof map[key] === 'boolean') {
            // chrome 85 support: &&=, ||=
            map[key] &&= value;
        }
    };
    /**
     * 布尔值 - 或
     * @param map 属性映射表
     * @param key 属性键
     * @param value 布尔值
     */
    BOOLEAN_OR = (map, key, value) => {
        if (typeof map[key] === 'boolean') {
            map[key] ||= value;
        }
    };
    /**
     * 布尔值 - 异或
     * @param map 属性映射表
     * @param key 属性键
     * @param value 布尔值
     */
    BOOLEAN_XOR = (map, key, value) => {
        if (typeof map[key] === 'boolean') {
            map[key] = map[key] !== value;
        }
    };
    /**
     * 数值 - 获取
     * @param map 属性映射表
     * @param key 属性键
     * @returns 数值
     */
    NUMBER_GET = (map, key) => {
        const value = map[key];
        return typeof value === 'number' ? value : undefined;
    };
    /**
     * 数值 - 设置
     * @param map 属性映射表
     * @param key 属性键
     * @param value 数值
     */
    NUMBER_SET = (map, key, value) => {
        switch (typeof map[key]) {
            case 'number':
            case 'undefined':
                map[key] = value;
                return;
        }
    };
    /**
     * 数值 - 加法
     * @param map 属性映射表
     * @param key 属性键
     * @param value 数值
     */
    NUMBER_ADD = (map, key, value) => {
        const number = map[key];
        if (typeof number === 'number') {
            map[key] = number + value;
        }
    };
    /**
     * 数值 - 减法
     * @param map 属性映射表
     * @param key 属性键
     * @param value 数值
     */
    NUMBER_SUB = (map, key, value) => {
        const number = map[key];
        if (typeof number === 'number') {
            map[key] = number - value;
        }
    };
    /**
     * 数值 - 乘法
     * @param map 属性映射表
     * @param key 属性键
     * @param value 数值
     */
    NUMBER_MUL = (map, key, value) => {
        const number = map[key];
        if (typeof number === 'number') {
            map[key] = number * value;
        }
    };
    /**
     * 数值 - 除法
     * @param map 属性映射表
     * @param key 属性键
     * @param value 数值
     */
    NUMBER_DIV = (map, key, value) => {
        const number = map[key];
        if (typeof number === 'number' && value !== 0) {
            map[key] = number / value;
        }
    };
    /**
     * 数值 - 取余
     * @param map 属性映射表
     * @param key 属性键
     * @param value 数值
     */
    NUMBER_MOD = (map, key, value) => {
        const number = map[key];
        if (typeof number === 'number' && value !== 0) {
            map[key] = number % value;
        }
    };
    /**
     * 字符串 - 获取
     * @param map 属性映射表
     * @param key 属性键
     * @returns 字符串
     */
    STRING_GET = (map, key) => {
        const value = map[key];
        return typeof value === 'string' ? value : undefined;
    };
    /**
     * 字符串 - 设置
     * @param map 属性映射表
     * @param key 属性键
     * @param value 字符串
     */
    STRING_SET = (map, key, value) => {
        switch (typeof map[key]) {
            case 'string':
            case 'undefined':
                map[key] = value;
                return;
        }
    };
    /**
     * 字符串 - 加法
     * @param map 属性映射表
     * @param key 属性键
     * @param value 字符串
     */
    STRING_ADD = (map, key, value) => {
        if (typeof map[key] === 'string') {
            map[key] += value;
        }
    };
    /**
     * 角色 - 获取
     * @param map 属性映射表
     * @param key 属性键
     * @returns 角色实例
     */
    ACTOR_GET = (map, key) => {
        const value = map[key];
        return value instanceof Actor ? value : undefined;
    };
    /**
     * 技能 - 获取
     * @param map 属性映射表
     * @param key 属性键
     * @returns 技能实例
     */
    SKILL_GET = (map, key) => {
        const value = map[key];
        return value instanceof Skill ? value : undefined;
    };
    /**
     * 状态 - 获取
     * @param map 属性映射表
     * @param key 属性键
     * @returns 状态实例
     */
    STATE_GET = (map, key) => {
        const value = map[key];
        return value instanceof State ? value : undefined;
    };
    /**
     * 装备 - 获取
     * @param map 属性映射表
     * @param key 属性键
     * @returns 装备实例
     */
    EQUIPMENT_GET = (map, key) => {
        const value = map[key];
        return value instanceof Equipment ? value : undefined;
    };
    /**
     * 物品 - 获取
     * @param map 属性映射表
     * @param key 属性键
     * @returns 物品实例
     */
    ITEM_GET = (map, key) => {
        const value = map[key];
        return value instanceof Item ? value : undefined;
    };
    /**
     * 触发器 - 获取
     * @param map 属性映射表
     * @param key 属性键
     * @returns 触发器实例
     */
    TRIGGER_GET = (map, key) => {
        const value = map[key];
        return value instanceof Trigger ? value : undefined;
    };
    /**
     * 光源 - 获取
     * @param map 属性映射表
     * @param key 属性键
     * @returns 光源实例
     */
    LIGHT_GET = (map, key) => {
        const value = map[key];
        return value instanceof SceneLight ? value : undefined;
    };
    /**
     * 元素 - 获取
     * @param map 属性映射表
     * @param key 属性键
     * @returns 元素实例
     */
    ELEMENT_GET = (map, key) => {
        const value = map[key];
        return value instanceof UIElement ? value : undefined;
    };
    /**
     * 对象 - 获取
     * @param map 属性映射表
     * @param key 属性键
     * @returns 对象
     */
    OBJECT_GET = (map, key) => {
        const value = map[key];
        return typeof value === 'object' ? value : undefined;
    };
    /**
     * 对象 - 设置
     * @param map 属性映射表
     * @param key 属性键
     * @param value 对象
     */
    OBJECT_SET = (map, key, value) => {
        switch (typeof map[key]) {
            case 'object':
            case 'undefined':
                map[key] = value ?? undefined;
                return;
        }
    };
    /**
     * 列表 - 获取
     * @param map 属性映射表
     * @param key 属性键
     * @returns 列表
     */
    LIST_GET = (map, key) => {
        const value = map[key];
        return Array.isArray(value) ? value : undefined;
    };
};
/** ******************************** 枚举管理器 ******************************** */
let Enum = new class EnumerationManager {
    // {枚举ID:枚举对象}映射表
    idMap = {};
    // {群组ID:枚举值:枚举名称}映射表
    groupMap = {};
    /** 初始化枚举管理器 */
    initialize() {
        this.unpack(Data.enumeration.strings, []);
        delete Data.enumeration;
    }
    /**
     * 获取枚举对象
     * @param enumId 枚举ID
     * @returns 枚举对象
     */
    get(enumId) {
        return this.idMap[enumId];
    }
    /**
     * 获取枚举名称(未使用)
     * @param enumId 枚举ID
     * @returns 枚举名称
     */
    getName(enumId) {
        return this.idMap[enumId]?.name ?? '';
    }
    /**
     * 获取枚举值
     * @param enumId 枚举ID
     * @returns 枚举值(默认: '')
     */
    getValue(enumId) {
        return this.idMap[enumId]?.value ?? '';
    }
    /**
     * 获取枚举群组
     * @param groupId 群组ID
     * @returns 枚举群组
     */
    getGroup(groupId) {
        return this.groupMap[groupId];
    }
    /**
     * 解包枚举和群组的数据
     * @param items 枚举数据列表
     * @param groupKeys 群组ID的栈列表
     */
    unpack(items, groupKeys) {
        for (const item of items) {
            const id = item.id;
            if ('children' in item) {
                // 解包文件夹中的枚举对象
                Enum.groupMap[id] = new ItemGroup();
                groupKeys.push(id);
                this.unpack(item.children, groupKeys);
                groupKeys.pop();
            }
            else {
                // 构建枚举对象映射关系
                this.idMap[id] = item;
                if (item.value === '') {
                    item.value = id;
                }
                // 构建{群组ID:枚举值:枚举名称}映射表
                for (const key of groupKeys) {
                    Enum.groupMap[key].set(item.id, item);
                }
            }
        }
    }
};
/** ******************************** 数据项群组 ******************************** */
class ItemGroup {
    /** 数据项列表 */
    list = [];
    /** {键:数据项}映射表 */
    map = {};
    /**
     * 获取数据项
     * @param key 键
     * @returns 数据项
     */
    get(key) {
        return this.map[key];
    }
    /**
     * 设置数据项
     * @param key 键
     * @param item 数据项
     */
    set(key, item) {
        if (!(key in this.map)) {
            this.map[key] = item;
            this.list.push(item);
        }
    }
    /**
     * 删除数据项
     * @param key 键
     */
    delete(key) {
        const item = this.map[key];
        if (item) {
            this.list.remove(item);
            delete this.map[key];
        }
    }
}
//# sourceMappingURL=variable.js.map