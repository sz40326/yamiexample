/** ******************************** 回调管理器 ******************************** */
// 在移除场景对象的组件时，经常需要将操作推迟到栈尾
// 比如在遍历组件列表时调用了事件或脚本，将其中一个组件移除
// 这可能会破坏正在遍历的顺序，从而产生意外
// 可以用Callback.push(fn)将要做的事情推迟到当前帧的栈尾执行
let Callback = new class CallbackManager {
    /** 回调函数列表 */
    functions = [];
    /** 回调函数计数 */
    count = 0;
    /**
     * 推送回调函数，稍后执行
     * @param fn 回调函数
     */
    push(fn) {
        this.functions[this.count++] = fn;
    }
    /** 执行回调函数 */
    update() {
        for (let i = 0; i < this.count; i++) {
            this.functions[i]();
            this.functions[i] = null;
        }
        this.count = 0;
    }
    /** 重置回调堆栈 */
    reset() {
        for (let i = 0; i < this.count; i++) {
            this.functions[i] = null;
        }
        this.count = 0;
    }
};
/** ******************************** 全局事件管理器 ******************************** */
let EventManager = new class GlobalEventManager {
    /** 管理器版本号(重置时更新) */
    version = 0;
    /** 全局事件映射表(GUID->指令列表) */
    guidMap = {};
    /** 已激活事件列表 */
    activeEvents = [];
    /** {类型:事件列表}映射表 */
    typeMap = {
        common: [],
        autorun: [],
        keydown: [],
        keyup: [],
        mousedown: [],
        mouseup: [],
        mousemove: [],
        doubleclick: [],
        wheel: [],
        touchstart: [],
        touchmove: [],
        touchend: [],
        gamepadbuttonpress: [],
        gamepadbuttonrelease: [],
        gamepadleftstickchange: [],
        gamepadrightstickchange: [],
        equipmentgain: [],
        itemgain: [],
        moneygain: [],
        startup: [],
        createscene: [],
        loadscene: [],
        loadsave: [],
        showtext: [],
        showchoices: [],
        preload: [],
    };
    /** {注册键:事件}映射表 */
    keyMap = {};
    /** 脚本管理器 */
    script;
    /** 初始化全局事件管理器 */
    initialize() {
        const { guidMap, typeMap } = this;
        const events = Object.values(Data.events);
        // 删除数据释放内存
        delete Data.events;
        // 编译事件指令
        for (const { id, path, enabled, priority, namespace, returnType, description, parameters, type, commands } of events) {
            commands.path = '@ ' + path;
            const cmds = Command.compile(commands);
            let parent = typeMap[type];
            if (parent === undefined) {
                parent = typeMap[type] = [];
            }
            cmds.type = type;
            cmds.path = commands.path;
            cmds.default = enabled;
            cmds.enabled = enabled;
            cmds.priority = priority;
            cmds.namespace = namespace;
            cmds.returnType = returnType;
            cmds.description = description;
            cmds.parameters = parameters;
            cmds.parent = parent;
            parent.push(cmds);
            guidMap[id] = cmds;
        }
        // 侦听事件
        Scene.on('create', () => this.emit('createscene'));
        Scene.on('load', () => this.emit('loadscene'));
        Scene.on('keydown', (event) => this.emit('keydown', { priority: false, argument: event }));
        Scene.on('keyup', (event) => this.emit('keyup', { priority: false, argument: event }));
        Scene.on('mousedown', (event) => this.emit('mousedown', { priority: false, argument: event }));
        Scene.on('mouseup', (event) => this.emit('mouseup', { priority: false, argument: event }));
        Scene.on('mousemove', (event) => this.emit('mousemove', { priority: false, argument: event }));
        Scene.on('doubleclick', (event) => this.emit('doubleclick', { priority: false, argument: event }));
        Scene.on('wheel', (event) => this.emit('wheel', { priority: false, argument: event }));
        Scene.on('touchstart', (event) => this.emit('touchstart', { priority: false, argument: event }));
        Scene.on('touchmove', (event) => this.emit('touchmove', { priority: false, argument: event }));
        Scene.on('touchend', (event) => this.emit('touchend', { priority: false, argument: event }));
        Scene.on('gamepadbuttonpress', (event) => this.emit('gamepadbuttonpress', { priority: false, argument: event }));
        Scene.on('gamepadbuttonrelease', (event) => this.emit('gamepadbuttonrelease', { priority: false, argument: event }));
        Scene.on('gamepadleftstickchange', (event) => this.emit('gamepadleftstickchange', { priority: false, argument: event }));
        Scene.on('gamepadrightstickchange', (event) => this.emit('gamepadrightstickchange', { priority: false, argument: event }));
        Input.on('keydown', (event) => this.emit('keydown', { priority: true, argument: event }), true);
        Input.on('keyup', (event) => this.emit('keyup', { priority: true, argument: event }), true);
        Input.on('mousedown', (event) => this.emit('mousedown', { priority: true, argument: event }), true);
        Input.on('mouseup', (event) => this.emit('mouseup', { priority: true, argument: event }), true);
        Input.on('mousemove', (event) => this.emit('mousemove', { priority: true, argument: event }), true);
        Input.on('doubleclick', (event) => this.emit('doubleclick', { priority: true, argument: event }), true);
        Input.on('wheel', (event) => this.emit('wheel', { priority: true, argument: event }), true);
        Input.on('touchstart', (event) => this.emit('touchstart', { priority: true, argument: event }), true);
        Input.on('touchmove', (event) => this.emit('touchmove', { priority: true, argument: event }), true);
        Input.on('touchend', (event) => this.emit('touchend', { priority: true, argument: event }), true);
        Input.on('gamepadbuttonpress', (event) => this.emit('gamepadbuttonpress', { priority: true, argument: event }), true);
        Input.on('gamepadbuttonrelease', (event) => this.emit('gamepadbuttonrelease', { priority: true, argument: event }), true);
        Input.on('gamepadleftstickchange', (event) => this.emit('gamepadleftstickchange', { priority: true, argument: event }), true);
        Input.on('gamepadrightstickchange', (event) => this.emit('gamepadrightstickchange', { priority: true, argument: event }), true);
    }
    /**
     * 注册事件指令
     * @param key 事件的键
     * @param type 事件类型
     */
    register(key, type, commandList) {
        if (key === '')
            return;
        // 取消已注册的相同键的事件指令
        const context = this.keyMap[key];
        if (context) {
            // 忽略重复注册
            if (context.commandList === commandList)
                return;
            this.stopEvents(context.commandList);
            this.typeMap[context.type].remove(context.commandList);
        }
        // 注册新的事件指令
        this.keyMap[key] = { type, commandList };
        // 推迟注册事件以避免立即触发
        Callback.push(() => {
            if (this.keyMap[key]?.commandList === commandList) {
                (this.typeMap[type] ??= []).push(commandList);
            }
        });
        // 如果是自动执行事件，立即执行
        if (type === 'autorun') {
            EventHandler.call(new EventHandler(commandList));
        }
    }
    /**
     * 取消注册事件指令
     * @param key 事件的键
     */
    unregister(key) {
        const context = this.keyMap[key];
        if (context) {
            const { type, commandList } = context;
            this.typeMap[type]?.remove(commandList);
            this.stopEvents(commandList);
            delete this.keyMap[key];
        }
    }
    /** 取消注册所有事件指令 */
    unregisterAll() {
        const keyMap = this.keyMap;
        const typeMap = this.typeMap;
        for (const key of Object.keys(keyMap)) {
            const { type, commandList } = keyMap[key];
            typeMap[type]?.remove(commandList);
            this.stopEvents(commandList);
            delete keyMap[key];
        }
    }
    /**
     * 停止指定的正在执行的(多个)事件
     * @param commandList 指令函数列表
     */
    stopEvents(commandList) {
        for (const event of this.activeEvents) {
            if (event.initial === commandList) {
                event.finish();
            }
        }
    }
    /**
     * 获取指定ID的事件指令列表
     * @param id 事件ID
     * @returns 指令列表
     */
    get(id) {
        return this.guidMap[id];
    }
    /** 重置全局事件的状态 */
    reset() {
        this.unregisterAll();
        for (const commands of Object.values(this.guidMap)) {
            commands.enabled = commands.default;
        }
        this.version++;
    }
    /**
     * 获取已启用的事件指令
     * @param type 事件类型
     */
    getEnabledEvents(type) {
        const list = [];
        for (const commands of this.typeMap[type]) {
            if (commands.enabled) {
                list.push(commands);
            }
        }
        return list;
    }
    /**
     * 调用全局事件
     * @param id 全局事件文件ID
     * @returns 生成的事件处理器
     */
    call(id) {
        const commands = this.guidMap[id];
        if (commands) {
            return EventHandler.call(new EventHandler(commands));
        }
    }
    /**
     * 发送全局事件
     * @param type 全局事件类型
     * @param options 全局事件选项
     */
    emit(type, options = {}) {
        for (const commands of this.typeMap[type] ?? []) {
            if (commands.enabled && (!('priority' in options) ||
                commands.priority === options.priority)) {
                const event = new EventHandler(commands);
                // 加载事件属性
                if ('properties' in options) {
                    Object.assign(event, options.properties);
                }
                // 设置事件优先级
                event.priority = commands.priority;
                EventHandler.call(event);
                // 如果事件停止传递，跳出
                if (type in Input.listeners && Input.bubbles.get() === false) {
                    return;
                }
            }
        }
        // 执行脚本事件(默认为高优先级)
        if (options.priority !== false) {
            this.script.emit(type, options.argument);
        }
    }
    /**
     * 添加已激活事件处理器
     * @param event 事件处理器
     */
    append(event) {
        this.activeEvents.push(event);
        // 添加事件完成回调函数：延迟移除
        event.onFinish(() => {
            Callback.push(() => {
                this.activeEvents.remove(event);
            });
        });
    }
    /**
     * 更新管理器中的已激活事件处理器
     * @param deltaTime 增量时间(毫秒)
     */
    update(deltaTime) {
        if (Game.paused === false) {
            for (const event of this.activeEvents) {
                event.update(deltaTime);
            }
        }
        else {
            for (const event of this.activeEvents) {
                if (event.priority) {
                    event.update(deltaTime);
                }
            }
        }
        // 调试模式下检查独立执行事件
        if (Stats.debug) {
            for (const event of this.activeEvents) {
                if (event.type === 'independent') {
                    const independent = event;
                    if (independent.debugTimeout === undefined) {
                        independent.debugTimeout = 0;
                    }
                    else {
                        independent.debugTimeout += deltaTime;
                        if (independent.debugTimeout >= 60000) {
                            independent.debugTimeout = -Infinity;
                            const initial = independent.initial;
                            const warning = `An "Independent" event remains in the background.\n${initial.path}`;
                            console.warn(warning);
                            MessageReporter.displayMessage(warning);
                        }
                    }
                }
            }
        }
    }
    /**
     * 启用全局事件(延迟)
     * @param id 全局事件文件ID
     */
    enable(id) {
        const commands = this.guidMap[id];
        if (commands) {
            const { version } = this;
            commands.callback = () => {
                if (this.version === version) {
                    commands.enabled = true;
                }
                delete commands.callback;
            };
            Callback.push(() => {
                commands.callback?.();
            });
        }
    }
    /**
     * 禁用全局事件(立即)
     * @param id 全局事件文件ID
     */
    disable(id) {
        const commands = this.guidMap[id];
        if (commands) {
            commands.enabled = false;
            delete commands.callback;
        }
    }
    /**
     * 设置全局事件为最高优先级
     * @param id 全局事件文件ID
     */
    setToHighestPriority(id) {
        const commands = this.guidMap[id];
        if (commands) {
            // 延迟执行，将事件移动到头部
            Callback.push(() => {
                commands.priority = true;
                const list = commands.parent;
                const index = list.indexOf(commands);
                for (let i = index; i > 0; i--) {
                    list[i] = list[i - 1];
                }
                list[0] = commands;
            });
        }
    }
};
/** ******************************** 插件管理器 ******************************** */
let PluginManager = new class PluginManager {
    /** 初始化插件管理器 */
    initialize() {
        const plugins = Data.plugins;
        const manager = ScriptManager.create({}, plugins);
        // 获取脚本实例，以类名作为键进行注册
        for (const instance of manager.instances) {
            const name = instance.constructor.name;
            if (name !== '')
                this[name] = instance;
        }
        // 设置到事件管理器中
        EventManager.script = manager;
    }
};
// 正在执行的事件相关属性(全局)
let CurrentEvent = { commands: [], index: 0, attributes: {} };
let CommandList;
let CommandIndex;
/** ******************************** 事件处理器 ******************************** */
class EventHandler {
    /** 事件是否已完成 */
    complete;
    /** 指令函数列表 */
    commands;
    /** 初始指令函数列表 */
    initial;
    /** 正在执行的指令索引 */
    index;
    /** 指令堆栈 */
    stack;
    /** {键:属性值}映射表 */
    attributes;
    /** 父对象 */
    parent;
    /** 计时器 */
    timer;
    /** 事件优先级 */
    priority;
    /** 是否传递事件 */
    bubble;
    /** 事件触发角色 */
    triggerActor;
    /** 事件触发技能 */
    triggerSkill;
    /** 事件触发状态 */
    triggerState;
    /** 事件触发装备 */
    triggerEquipment;
    /** 事件触发物品 */
    triggerItem;
    /** 事件触发对象 */
    triggerObject;
    /** 事件触发光源 */
    triggerLight;
    /** 事件触发区域 */
    triggerRegion;
    /** 事件触发地图 */
    triggerTilemap;
    /** 事件触发元素 */
    triggerElement;
    /** 技能施放角色 */
    casterActor;
    /** 目标角色 */
    targetActor;
    /** 独立变量ID */
    selfVarId;
    /** 保存的指令列表 */
    savedCommands;
    /** 保存的指令索引 */
    savedIndex;
    /** 遍历数据列表 */
    forEach;
    /** 过渡数据列表 */
    transitions;
    /** 回调函数列表 */
    callbacks;
    /** 类型 */
    get type() { return this.initial.type; }
    /** 路径 */
    get path() { return this.initial.path; }
    /**
     * 事件处理器
     * @param commands 事件指令列表
     */
    constructor(commands) {
        this.complete = false;
        this.priority = false;
        this.commands = commands;
        this.initial = commands;
        this.index = 0;
        this.stack = new CommandStack();
        // 是否继承一个事件处理器的数据
        if (commands.inheritance) {
            this.inheritEventContext(commands.inheritance);
            this.attributes = commands.inheritance.attributes;
        }
        else {
            this.attributes = {};
        }
    }
    /**
     * 执行事件指令
     * @param deltaTime 增量时间(毫秒)
     * @returns 事件是否已完成
     */
    update(deltaTime) {
        // 设置相关属性到全局变量
        CurrentEvent = this;
        CommandList = this.commands;
        CommandIndex = this.index;
        // 连续执行指令，直到返回false(中断)
        while (CommandList[CommandIndex++]()) { }
        // 取回全局变量中的事件属性
        this.commands = CommandList;
        this.index = CommandIndex;
        // 返回事件完成状态
        return this.complete;
    }
    /**
     * 获取事件计时器
     * @returns 事件计时器
     */
    getTimer() {
        return this.timer ?? (this.timer = new EventTimer(this));
    }
    /**
     * 事件等待指定时间
     * @param duration 等待时间(毫秒)
     * @returns 中断指令的执行
     */
    wait(duration) {
        this.getTimer().set(duration);
        return false;
    }
    /**
     * 暂停执行事件
     * @returns 中断指令的执行
     */
    pause() {
        this.getTimer();
        // 设置更新函数为：等待
        this.update = EventHandler.wait;
        return false;
    }
    /** 继续执行事件 */
    continue() {
        this.timer?.continue();
    }
    /** 调用事件结束回调函数 */
    finish() {
        this.complete = true;
        // 执行结束回调
        if (this.callbacks !== undefined) {
            for (const callback of this.callbacks) {
                callback(this);
            }
        }
    }
    /**
     * 设置事件结束回调
     * @param callback 回调函数
     */
    onFinish(callback) {
        if (this.complete) {
            callback(this);
        }
        else {
            // 添加回调函数到队列中
            if (this.callbacks !== undefined) {
                this.callbacks.push(callback);
            }
            else {
                this.callbacks = [callback];
            }
        }
    }
    /** 继承事件上下文 */
    inheritEventContext(event) {
        this.attributes = event.attributes;
        if ('priority' in event) {
            this.priority = event.priority;
        }
        for (const key of EventHandler.inheritedKeys) {
            // 继承事件上下文属性
            if (key in event) {
                this[key] = event[key];
            }
        }
    }
    /**
     * 返回等待状态(暂停事件方法)
     * @returns 中断指令的执行
     */
    static wait = () => false;
    /**
     * 调用事件
     * @param event 事件处理器
     * @param updaters 更新器列表
     * @returns 传入的事件处理器
     */
    static call = (event, updaters) => {
        this.save();
        // 如果事件更新后发生了等待
        if (event.update(0) === false) {
            if (updaters !== undefined) {
                // 如果指定了更新器列表，延迟将未执行完的事件放入
                Callback.push(() => {
                    updaters.append(event);
                });
                // 设置事件结束时回调函数：延迟从更新器中移除
                event.onFinish(() => {
                    Callback.push(() => {
                        updaters.remove(event);
                    });
                });
            }
            else {
                // 如果未指定更新器列表，添加到事件管理器中
                Callback.push(() => {
                    EventManager.append(event);
                });
            }
        }
        this.restore();
        return event;
    };
    // 事件栈
    static stacks = [];
    // 事件栈索引
    static index = 0;
    /** 保存正在执行的事件状态 */
    static save() {
        this.stacks[this.index++] = CurrentEvent;
        CurrentEvent.commands = CommandList;
        CurrentEvent.index = CommandIndex;
    }
    /** 恢复事件状态 */
    static restore() {
        CurrentEvent = this.stacks[--this.index];
        CommandList = CurrentEvent.commands;
        CommandIndex = CurrentEvent.index;
    }
    // 继承事件上下文的属性键
    static inheritedKeys = [
        'triggerActor',
        'triggerSkill',
        'triggerState',
        'triggerEquipment',
        'triggerItem',
        'triggerObject',
        'triggerLight',
        'triggerRegion',
        'triggerTilemap',
        'triggerElement',
        'casterActor',
        'targetActor',
        'selfVarId',
    ];
}
/** ******************************** 事件计时器 ******************************** */
class EventTimer {
    /** 等待时间 */
    duration;
    /** 绑定的事件处理器 */
    event;
    /**
     * @param event 事件处理器
     */
    constructor(event) {
        this.duration = 0;
        this.event = event;
        event.timer = this;
    }
    /**
     * 设置等待时间
     * @param waitingTime 等待时间
     */
    set(waitingTime) {
        this.duration = waitingTime;
        // 设置更新函数为：计时
        this.event.update = this.tick;
    }
    /** 继续事件 */
    continue() {
        // 恢复更新函数
        this.event.update = EventHandler.prototype.update;
    }
    /**
     * 等待计时函数
     * @param this 事件处理器
     * @param deltaTime 增量时间(毫秒)
     * @returns 事件是否执行完毕
     */
    tick(deltaTime) {
        if ((this.timer.duration -= deltaTime) <= 0) {
            this.update = EventHandler.prototype.update;
            return this.update(deltaTime);
        }
        return false;
    }
}
/** ******************************** 脚本方法列表 ******************************** */
class ScriptMethodList extends Array {
    /** 有效方法计数 */
    count = 0;
    /**
     * 添加方法到列表中
     * @param scriptInstance 脚本实例
     * @param methodName 方法名称
     */
    add(scriptInstance, methodName) {
        if (this.count < this.length) {
            const wrap = this[this.count++];
            wrap.scriptInstance = scriptInstance;
            wrap.methodName = methodName;
        }
        else {
            this[this.count++] = {
                scriptInstance,
                methodName,
            };
        }
    }
    /**
     * 调用所有方法
     * @param argument 传递方法参数
     */
    call(argument) {
        for (let i = 0; i < this.count; i++) {
            const wrap = this[i];
            wrap.scriptInstance[wrap.methodName](argument);
        }
    }
    /**
     * 重置列表
     * @returns 当前对象
     */
    reset() {
        this.count = 0;
        return this;
    }
}
/** ******************************** 脚本管理器 ******************************** */
class ScriptManager {
    /** 父对象 */
    parent;
    /** 脚本实例 */
    instances;
    /**
     * 脚本管理器
     * @param owner 脚本宿主对象
     */
    constructor(owner) {
        this.parent = owner;
        this.instances = [];
    }
    /**
     * 添加脚本对象
     * @param instance 脚本对象
     */
    add(instance) {
        // 以脚本类名作为键进行注册
        const name = instance.constructor.name;
        if (name !== '')
            this[name] = instance;
        // 如果实现了update方法，则添加到父级更新器列表
        if (typeof instance.update === 'function') {
            this.parent.updaters?.push(instance);
        }
        this.instances.push(instance);
        // 触发添加脚本事件
        instance.onScriptAdd?.(this.parent);
    }
    /**
     * 移除脚本对象(未使用)
     * @param instance 脚本对象
     */
    remove(instance) {
        const name = instance.constructor.name;
        if (this[name] === instance)
            delete this[name];
        if (typeof instance.update === 'function') {
            this.parent.updaters?.remove(instance);
        }
        this.instances.remove(instance);
        // 触发移除脚本事件
        instance.onScriptRemove?.(this.parent);
    }
    /**
     * 调用脚本方法
     * @param method 方法名称
     * @param args 传递参数
     */
    call(method, ...args) {
        for (const instance of this.instances) {
            instance[method]?.(...args);
        }
    }
    /**
     * 发送脚本事件
     * @param type 事件类型
     * @param argument 传递参数
     */
    emit(type, argument) {
        // 将事件类型映射到脚本事件方法名称
        const method = ScriptManager.eventTypeMap[type] ?? '';
        // 调用每个脚本对象的事件方法，并传递参数
        for (const instance of this.instances) {
            if (method in instance) {
                instance[method](argument);
                // 如果事件停止传递，跳出
                if (type in Input.listeners && Input.bubbles.get() === false) {
                    return;
                }
            }
        }
    }
    /**
     * 获取脚本事件列表
     * @param type 事件类型
     * @returns 脚本事件列表
     */
    getEvents(type) {
        // 将事件类型映射到脚本事件方法名称
        const method = ScriptManager.eventTypeMap[type] ?? '';
        const methods = ScriptManager.scriptMethods.reset();
        // 调用每个脚本对象的事件方法，并传递参数
        for (const instance of this.instances) {
            if (typeof instance[method] === 'function') {
                methods.add(instance, method);
            }
        }
        return methods.count > 0 ? methods : undefined;
    }
    /** 延迟获取函数返回参数的开关 */
    static deferredLoading = false;
    /** 延迟获取函数返回参数的数量 */
    static deferredCount = 0;
    /** 延迟加载的脚本实例列表 */
    static deferredInstances = [];
    /** 延迟加载参数的键列表 */
    static deferredKeys = [];
    /** 延迟加载参数的返回值函数列表 */
    static deferredValues = [];
    /** 脚本方法列表 */
    static scriptMethods = new ScriptMethodList();
    /**
     * 放入延迟获取的脚本参数
     * 等待场景对象和UI元素创建完毕后再获取
     * @param instance 脚本对象
     * @param key 参数的键
     * @param value 返回值函数
     */
    static pushDeferredParameter(instance, key, value) {
        ScriptManager.deferredInstances[ScriptManager.deferredCount] = instance;
        ScriptManager.deferredKeys[ScriptManager.deferredCount] = key;
        ScriptManager.deferredValues[ScriptManager.deferredCount] = value;
        ScriptManager.deferredCount++;
    }
    /** 加载延迟参数到脚本对象中 */
    static loadDeferredParameters() {
        for (let i = 0; i < ScriptManager.deferredCount; i++) {
            ScriptManager.deferredInstances[i][ScriptManager.deferredKeys[i]] = ScriptManager.deferredValues[i]();
            ScriptManager.deferredInstances[i] = undefined;
            ScriptManager.deferredValues[i] = undefined;
        }
        ScriptManager.deferredCount = 0;
        ScriptManager.deferredLoading = false;
    }
    /**
     * 创建脚本管理器(使用脚本数据)
     * @param owner 脚本宿主对象
     * @param data 脚本数据列表
     * @returns 生成的脚本管理器
     */
    static create(owner, data) {
        const manager = new ScriptManager(owner);
        // 如果脚本列表不为空
        if (data.length > 0) {
            for (const wrap of data) {
                // 如果脚本已禁用，跳过
                if (wrap.enabled === false)
                    continue;
                // 初始化以及重构参数列表(丢弃无效参数)
                if (wrap.initialized === undefined) {
                    wrap.initialized = true;
                    wrap.parameters = ScriptManager.compileParamList(wrap.id, wrap.parameters);
                }
                const { id, parameters } = wrap;
                const script = Data.scripts[id];
                // 如果不存在脚本，发送警告
                if (script === undefined) {
                    const meta = Data.manifest.guidMap[id];
                    const name = meta?.path ?? `#${id}`;
                    console.error(new Error(`The script is missing: ${name}`), owner);
                    continue;
                }
                // 创建脚本对象实例，并传递脚本参数
                const instance = new script.constructor(owner);
                const length = parameters.length;
                for (let i = 0; i < length; i += 2) {
                    const key = parameters[i];
                    let value = parameters[i + 1];
                    if (typeof value === 'function') {
                        if (ScriptManager.deferredLoading) {
                            // 如果值类型是函数，且开启了延时加载参数开关
                            ScriptManager.pushDeferredParameter(instance, key, value);
                            continue;
                        }
                        value = value();
                    }
                    instance[key] = value;
                }
                manager.add(instance);
            }
        }
        return manager;
    }
    /**
     * 编译脚本参数列表
     * @param id 脚本文件ID
     * @param parameters 脚本参数数据列表
     * @returns 编译后的脚本参数列表
     */
    static compileParamList(id, parameters) {
        const script = Data.scripts[id];
        // 如果不存在脚本，返回空列表
        if (script === undefined) {
            return Array.empty;
        }
        const defParameters = script.parameters;
        const length = defParameters.length;
        // 如果不存在参数，返回空列表
        if (length === 0) {
            return Array.empty;
        }
        // 创建扁平化的参数列表
        const parameterList = new Array(length * 2);
        for (let i = 0; i < length; i++) {
            const defParameter = defParameters[i];
            const { key, type } = defParameter;
            let value = parameters[key];
            // 根据默认参数类型，对实参进行有效性检查
            // 如果实参是无效的，则使用默认值
            switch (type) {
                case 'boolean':
                case 'number':
                    if (typeof value !== type) {
                        value = defParameter.value;
                    }
                    break;
                case 'variable-number':
                    if (typeof value !== 'number') {
                        if (value?.getter === 'variable') {
                            value = Command.compileVariable(value, Attribute.NUMBER_GET);
                        }
                        else {
                            value = Function.undefined;
                        }
                    }
                    break;
                case 'option':
                    if (!defParameter.options.includes(value)) {
                        value = defParameter.value;
                    }
                    break;
                case 'number[]':
                case 'string[]':
                    if (Array.isArray(value)) { }
                    else {
                        value = defParameter.value;
                    }
                    break;
                case 'attribute':
                    value = Attribute.get(value);
                    break;
                case 'attribute-key':
                    value = Attribute.getKey(value);
                    break;
                case 'enum':
                    value = Enum.get(value);
                    break;
                case 'enum-value':
                    value = Enum.getValue(value);
                    break;
                case 'actor': {
                    const id = value;
                    value = () => Scene.entity.get(id);
                    break;
                }
                case 'region': {
                    const id = value;
                    value = () => Scene.entity.get(id);
                    break;
                }
                case 'light': {
                    const id = value;
                    value = () => Scene.entity.get(id);
                    break;
                }
                case 'animation': {
                    const id = value;
                    value = () => Scene.entity.get(id);
                    break;
                }
                case 'particle': {
                    const id = value;
                    value = () => Scene.entity.get(id);
                    break;
                }
                case 'parallax': {
                    const id = value;
                    value = () => Scene.entity.get(id);
                    break;
                }
                case 'tilemap': {
                    const id = value;
                    value = () => Scene.entity.get(id);
                    break;
                }
                case 'element': {
                    const id = value;
                    value = () => UI.entity.get(id);
                    break;
                }
                case 'keycode':
                    if (typeof value !== 'string') {
                        value = defParameter.value;
                    }
                    break;
                case 'variable-getter':
                    if (value?.getter === 'variable') {
                        value = Command.compileVariable(value, Attribute.GET);
                    }
                    else {
                        value = Function.undefined;
                    }
                    break;
                case 'variable-setter':
                    if (value?.getter === 'variable') {
                        value = {
                            get: Command.compileVariable(value, Attribute.GET),
                            set: Command.compileVariable(value, Attribute.SAFE_SET),
                        };
                    }
                    else {
                        value = Function.undefined;
                    }
                    break;
                case 'actor-getter':
                    if (value?.getter === 'actor') {
                        value = Command.compileActor(value);
                    }
                    else {
                        value = Function.undefined;
                    }
                    break;
                case 'skill-getter':
                    if (value?.getter === 'skill') {
                        value = Command.compileSkill(value);
                    }
                    else {
                        value = Function.undefined;
                    }
                    break;
                case 'state-getter':
                    if (value?.getter === 'state') {
                        value = Command.compileState(value);
                    }
                    else {
                        value = Function.undefined;
                    }
                    break;
                case 'equipment-getter':
                    if (value?.getter === 'equipment') {
                        value = Command.compileEquipment(value);
                    }
                    else {
                        value = Function.undefined;
                    }
                    break;
                case 'item-getter':
                    if (value?.getter === 'item') {
                        value = Command.compileItem(value);
                    }
                    else {
                        value = Function.undefined;
                    }
                    break;
                case 'element-getter':
                    if (value?.getter === 'element') {
                        value = Command.compileElement(value);
                    }
                    else {
                        value = Function.undefined;
                    }
                    break;
                case 'position-getter':
                    if (value?.getter === 'position') {
                        const getPoint = Command.compilePosition(value);
                        value = () => {
                            const point = getPoint();
                            return point ? { x: point.x, y: point.y } : undefined;
                        };
                    }
                    else {
                        value = Function.undefined;
                    }
                    break;
                default:
                    if (typeof value !== 'string') {
                        value = defParameter.value;
                    }
                    break;
            }
            const pi = i * 2;
            parameterList[pi] = key;
            parameterList[pi + 1] = value;
        }
        return parameterList;
    }
    /** {事件类型:脚本方法名称}映射表 */
    static eventTypeMap = {
        common: '',
        update: 'update',
        create: 'onCreate',
        load: 'onLoad',
        autorun: 'onStart',
        collision: 'onCollision',
        hittrigger: 'onHitTrigger',
        hitactor: 'onHitActor',
        destroy: 'onDestroy',
        playerenter: 'onPlayerEnter',
        playerleave: 'onPlayerLeave',
        actorenter: 'onActorEnter',
        actorleave: 'onActorLeave',
        skillcast: 'onSkillCast',
        skilladd: 'onSkillAdd',
        skillremove: 'onSkillRemove',
        stateadd: 'onStateAdd',
        stateremove: 'onStateRemove',
        equipmentadd: 'onEquipmentAdd',
        equipmentremove: 'onEquipmentRemove',
        equipmentgain: '',
        itemuse: 'onItemUse',
        itemgain: '',
        moneygain: '',
        keydown: 'onKeyDown',
        keyup: 'onKeyUp',
        mousedown: 'onMouseDown',
        mousedownLB: 'onMouseDownLB',
        mousedownRB: 'onMouseDownRB',
        mouseup: 'onMouseUp',
        mouseupLB: 'onMouseUpLB',
        mouseupRB: 'onMouseUpRB',
        mousemove: 'onMouseMove',
        mouseenter: 'onMouseEnter',
        mouseleave: 'onMouseLeave',
        click: 'onClick',
        doubleclick: 'onDoubleClick',
        wheel: 'onWheel',
        touchstart: 'onTouchStart',
        touchmove: 'onTouchMove',
        touchend: 'onTouchEnd',
        select: 'onSelect',
        deselect: 'onDeselect',
        input: 'onInput',
        focus: 'onFocus',
        blur: 'onBlur',
        ended: 'onEnded',
        gamepadbuttonpress: 'onGamepadButtonPress',
        gamepadbuttonrelease: 'onGamepadButtonRelease',
        gamepadleftstickchange: 'onGamepadLeftStickChange',
        gamepadrightstickchange: 'onGamepadRightStickChange',
        startup: 'onStartup',
        createscene: 'onSceneCreate',
        loadscene: 'onSceneLoad',
        loadsave: 'onSaveLoad',
        preload: 'onPreload',
    };
}
/** ******************************** 脚本键盘事件 ******************************** */
class ScriptKeyboardEvent {
    /** 浏览器键盘事件 */
    browserKeyboardEvent;
    /** 键名 */
    get keyName() {
        return this.browserKeyboardEvent.code;
    }
    /** Shift键是否按下 */
    get shiftKey() {
        return this.browserKeyboardEvent.shiftKey;
    }
    /** Meta键是否按下 */
    get metaKey() {
        return this.browserKeyboardEvent.metaKey;
    }
    /** Ctrl键是否按下 */
    get ctrlKey() {
        return this.browserKeyboardEvent.ctrlKey;
    }
    /** Alt键是否按下 */
    get altKey() {
        return this.browserKeyboardEvent.altKey;
    }
    /**
     * @param event 原生键盘事件
     */
    constructor(event) {
        this.browserKeyboardEvent = event;
    }
}
/** ******************************** 脚本鼠标事件 ******************************** */
class ScriptMouseEvent {
    /** 浏览器鼠标事件 */
    browserMouseEvent;
    /** 键码 */
    get button() {
        return this.browserMouseEvent.button;
    }
    /** Shift键是否按下 */
    get shiftKey() {
        return this.browserMouseEvent.shiftKey;
    }
    /** Meta键是否按下 */
    get metaKey() {
        return this.browserMouseEvent.metaKey;
    }
    /** Ctrl键是否按下 */
    get ctrlKey() {
        return this.browserMouseEvent.ctrlKey;
    }
    /** Alt键是否按下 */
    get altKey() {
        return this.browserMouseEvent.altKey;
    }
    /**
     * @param event 原生鼠标(指针)事件
     */
    constructor(event) {
        this.browserMouseEvent = event;
    }
}
/** ******************************** 脚本滚轮事件 ******************************** */
class ScriptWheelEvent {
    /** 浏览器滚轮事件 */
    browserWheelEvent;
    /** 垂直滑动增量 */
    get deltaY() {
        return this.browserWheelEvent.deltaY;
    }
    /** Shift键是否按下 */
    get shiftKey() {
        return this.browserWheelEvent.shiftKey;
    }
    /** Meta键是否按下 */
    get metaKey() {
        return this.browserWheelEvent.metaKey;
    }
    /** Ctrl键是否按下 */
    get ctrlKey() {
        return this.browserWheelEvent.ctrlKey;
    }
    /** Alt键是否按下 */
    get altKey() {
        return this.browserWheelEvent.altKey;
    }
    /**
     * @param event 原生滚轮事件
     */
    constructor(event) {
        this.browserWheelEvent = event;
    }
}
/** ******************************** 脚本触摸事件 ******************************** */
class ScriptTouchEvent {
    /** 浏览器触摸事件 */
    browserTouchEvent;
    /** 触摸点列表 */
    touches;
    /** 已改变的触摸点列表 */
    changedTouches;
    /** Shift键是否按下 */
    get shiftKey() {
        return this.browserTouchEvent.shiftKey;
    }
    /** Meta键是否按下 */
    get metaKey() {
        return this.browserTouchEvent.metaKey;
    }
    /** Ctrl键是否按下 */
    get ctrlKey() {
        return this.browserTouchEvent.ctrlKey;
    }
    /** Alt键是否按下 */
    get altKey() {
        return this.browserTouchEvent.altKey;
    }
    /**
     * @param event 原生触摸事件
     */
    constructor(event) {
        this.browserTouchEvent = event;
        const touchMap = ScriptTouchEvent.touchMap;
        const rawTouches = event.touches;
        const newTouches = new Array(rawTouches.length);
        const rawChangedTouches = event.changedTouches;
        const newChangedTouches = new Array(rawChangedTouches.length);
        for (let i = 0; i < rawTouches.length; i++) {
            const rawTouch = rawTouches[i];
            const id = rawTouch.identifier;
            const newTouch = touchMap[id] ??= new TouchPoint();
            newTouches[i] = newTouch.set(rawTouch);
        }
        for (let i = 0; i < rawChangedTouches.length; i++) {
            const rawTouch = rawChangedTouches[i];
            const id = rawTouch.identifier;
            const newTouch = touchMap[id] ??= new TouchPoint();
            newChangedTouches[i] = newTouch.set(rawTouch);
        }
        this.touches = newTouches;
        this.changedTouches = newChangedTouches;
    }
    /**
     * 获取触摸点
     * @param touchId 触摸点ID
     * @returns 触摸点
     */
    getTouch(touchId) {
        for (const touch of this.changedTouches) {
            if (touch.id === touchId) {
                return touch;
            }
        }
        for (const touch of this.touches) {
            if (touch.id === touchId) {
                return touch;
            }
        }
        return undefined;
    }
    /** 触摸点映射表 */
    static touchMap = {};
}
/** ******************************** 触摸点 ******************************** */
class TouchPoint {
    /** 触摸点ID */
    id = 0;
    /** 屏幕X */
    screenX = 0;
    /** 屏幕Y */
    screenY = 0;
    /** 界面X */
    uiX = 0;
    /** 界面Y */
    uiY = 0;
    /** 场景X */
    sceneX = 0;
    /** 场景Y */
    sceneY = 0;
    /**
     * 设置触摸点
     * @param touch 原生触摸点
     */
    set(touch) {
        this.id = touch.identifier;
        const { x: screenX, y: screenY } = Mouse.convertClientToScreenCoords(touch.clientX, touch.clientY);
        this.screenX = screenX;
        this.screenY = screenY;
        this.uiX = screenX / UI.scale;
        this.uiY = screenY / UI.scale;
        const { x: sceneX, y: sceneY } = Mouse.convertScreenToSceneCoords(screenX, screenY);
        this.sceneX = sceneX;
        this.sceneY = sceneY;
        return this;
    }
}
/** ******************************** 脚本手柄事件 ******************************** */
class ScriptGamepadEvent {
    /** 游戏手柄 */
    gamepad;
    /** 摇杆角度(默认: -1) */
    stickAngle;
    /** 键码(默认: -1) */
    buttonCode;
    /** 键名(默认: '') */
    buttonName;
    /** 状态(即时更新) */
    states;
    /**
     * @param gamepad 游戏手柄
     */
    constructor(gamepad) {
        this.gamepad = gamepad;
        this.stickAngle = Controller.stickAngle;
        this.buttonCode = Controller.buttonCode;
        this.buttonName = Controller.buttonName;
        this.states = Controller.states;
    }
}
/** ******************************** 脚本输入事件 ******************************** */
class ScriptInputEvent {
    /** 浏览器输入事件 */
    browserInputEvent;
    /** 输入数据 */
    get data() {
        return this.browserInputEvent.data;
    }
    /** 输入类型 */
    get inputType() {
        return this.browserInputEvent.inputType;
    }
    /**
     * @param event 原生输入事件
     */
    constructor(event) {
        this.browserInputEvent = event;
    }
}
/** ******************************** 脚本碰撞事件 ******************************** */
class ScriptCollisionEvent {
    /** 当前角色 */
    actor;
    /** 碰撞角色 */
    contact;
    /**
     * @param actor 当前角色
     * @param contact 碰撞角色
     */
    constructor(actor, contact) {
        this.actor = actor;
        this.contact = contact;
    }
}
/** ******************************** 脚本触发器击中事件 ******************************** */
class ScriptTriggerHitEvent {
    /** 被击中的角色 */
    actor;
    /** 击中角色的触发器 */
    trigger;
    /** 触发器技能施放者 */
    caster;
    /**
     * @param actor 被击中的角色
     * @param trigger 击中角色的触发器
     */
    constructor(actor, trigger) {
        this.actor = actor;
        this.trigger = trigger;
        this.caster = trigger.caster;
    }
}
/** ******************************** 脚本区域事件 ******************************** */
class ScriptRegionEvent {
    /** 触发事件的角色 */
    actor;
    /** 区域对象 */
    region;
    /**
     * @param actor 触发事件的角色
     * @param region 区域对象
     */
    constructor(actor, region) {
        this.actor = actor;
        this.region = region;
    }
}
//# sourceMappingURL=event.js.map