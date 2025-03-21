/** ******************************** 数据管理器 ******************************** */
let Data = new class DataManager {
    /** 文件元数据清单 */
    manifest;
    /** {ID:角色文件}映射表 */
    actors;
    /** {ID:技能文件}映射表 */
    skills;
    /** {ID:触发器文件}映射表 */
    triggers;
    /** {ID:物品文件}映射表 */
    items;
    /** {ID:装备文件}映射表 */
    equipments;
    /** {ID:状态文件}映射表 */
    states;
    /** {ID:事件文件}映射表 */
    events;
    /** {类名:脚本文件构造函数}映射表 */
    scripts;
    /** {ID:过渡曲线}映射表 */
    easings;
    /** 队伍文件数据 */
    teams;
    /** 自动图块模板文件 */
    autotiles;
    /** 变量文件数据 */
    variables;
    /** 属性文件数据 */
    attribute;
    /** 枚举文件数据 */
    enumeration;
    /** 本地化文件数据 */
    localization;
    /** 插件文件数据 */
    plugins;
    /** 自定义指令文件数据 */
    commands;
    /** 项目配置文件 */
    config;
    /** {ID:场景文件}映射表 */
    scenes;
    /** {ID:界面文件}映射表 */
    ui;
    /** {ID:动画文件}映射表 */
    animations;
    /** {ID:粒子文件}映射表 */
    particles;
    /** {ID:图块文件}映射表 */
    tilesets;
    /** 全局存档数据 */
    globalData;
    /** 文件名包含的GUID正则表达式 */
    fileGuidRegExp = /[./]([0-9a-f]{16})\.\S+$/;
    /** 脚本编译后输出目录 */
    tsOutDir = '';
    /** 存档文件目录 */
    saveDir = '';
    /**
     * 初始化数据管理器
     */
    async initialize() {
        // 侦听窗口关闭前事件
        Game.on('quit', () => {
            this.saveGlobalData();
        });
        // 加载配置文件和存档路径
        await this.loadConfig();
        await Promise.all([
            this.loadTSConfig(),
            this.loadSaveDirPath(),
        ]);
        // 加载数据文件
        await Promise.all([
            this.loadMeta(),
            this.loadFile('attribute'),
            this.loadFile('enumeration'),
            this.loadFile('localization'),
            this.loadFile('easings'),
            this.loadFile('teams'),
            this.loadFile('autotiles'),
            this.loadFile('variables'),
            this.loadFile('plugins'),
            this.loadFile('commands'),
        ]);
        await Promise.all([
            this.loadScripts(),
            this.loadObjects(),
            this.loadGlobalData(),
        ]);
        this.createAutotileMap();
        this.createEasingMap();
    }
    /**
     * 加载文件的元数据清单
     */
    async loadMeta() {
        const path = 'Data/manifest.json';
        return Loader.get({
            path: path,
            type: 'json',
        }).then(data => {
            if (!data) {
                throw new SyntaxError(path);
            }
            return this.manifest = data;
        }).then(manifest => {
            // 创建GUID->元数据映射表
            const guidMap = {};
            const pathMap = {};
            Object.defineProperty(manifest, 'guidMap', { value: guidMap });
            Object.defineProperty(manifest, 'pathMap', { value: pathMap });
            for (const [key, group] of Object.entries(manifest)) {
                switch (key) {
                    case 'images':
                    case 'audio':
                    case 'videos':
                    case 'fonts':
                    case 'script':
                    case 'others':
                        // 处理异步资产文件的元数据
                        for (const meta of group) {
                            meta.guid = this.parseGUID(meta);
                            guidMap[meta.guid] = meta;
                            pathMap[meta.path] = meta;
                        }
                        break;
                    default:
                        if (!this.config.deployed) {
                            // 处理同步资产文件的元数据
                            for (const meta of group) {
                                meta.guid = this.parseGUID(meta);
                            }
                        }
                        break;
                }
            }
        });
    }
    /** 加载各种对象数据文件 */
    async loadObjects() {
        const { manifest } = this;
        const idDescriptor = { writable: true, value: '' };
        const pathDescriptor = { writable: true, value: '' };
        const filenameDescriptor = { writable: true, value: '' };
        const idAndPathDescriptors = {
            id: idDescriptor,
            path: pathDescriptor,
        };
        if (this.config.deployed) {
            // 加载已打包的数据
            for (const key of [
                'scenes',
                'actors',
                'skills',
                'triggers',
                'items',
                'equipments',
                'states',
                'events',
                'ui',
                'animations',
                'particles',
                'tilesets',
            ]) {
                const group = manifest[key];
                for (const [guid, data] of Object.entries(group)) {
                    idDescriptor.value = guid;
                    pathDescriptor.value = `File.${guid}`;
                    Object.defineProperties(data, idAndPathDescriptors);
                }
                if (key in this) {
                    this[key] = group;
                }
            }
        }
        else {
            // 加载未打包的数据
            const fileDescriptor = {
                path: '',
                type: 'json',
            };
            const table = [
                ['scenes', {}, null],
                ['actors', {}, null],
                ['skills', {}, null],
                ['triggers', {}, null],
                ['items', {}, null],
                ['equipments', {}, null],
                ['states', {}, null],
                ['events', {}, null],
                ['ui', {}, null],
                ['animations', {}, null],
                ['particles', {}, null],
                ['tilesets', {}, null],
            ];
            // 加载所有对象
            for (const row of table) {
                const key = row[0];
                const group = manifest[key];
                const length = group.length;
                const promises = new Array(length);
                for (let i = 0; i < length; i++) {
                    fileDescriptor.path = group[i].path;
                    promises[i] = Loader.get(fileDescriptor);
                }
                row[2] = { group, promises };
            }
            // 等待加载完成并设置ID
            for (const row of table) {
                const key = row[0];
                const map = row[1];
                const { group, promises } = row[2];
                const length = group.length;
                for (let i = 0; i < length; i++) {
                    const meta = group[i];
                    try {
                        const data = await promises[i];
                        const id = meta.guid;
                        idDescriptor.value = id;
                        pathDescriptor.value = meta.path;
                        Object.defineProperties(data, idAndPathDescriptors);
                        map[id] = data;
                    }
                    catch (error) {
                        console.warn(`Failed to read file: ${error.message}`);
                    }
                }
                this[key] = map;
            }
            // 提取技能|物品|装备的文件名(用于排序)
            const guidAndExt = /\.[0-9a-f]{16}\.\S+$/;
            for (const key of ['skills', 'items', 'equipments']) {
                const dataMap = this[key];
                for (const { guid, path } of manifest[key]) {
                    const item = dataMap[guid];
                    if (item !== undefined) {
                        const index = path.lastIndexOf('/') + 1;
                        filenameDescriptor.value = path.slice(index).replace(guidAndExt, '');
                        Object.defineProperty(item, 'filename', filenameDescriptor);
                    }
                }
            }
        }
        this.precompile();
    }
    /** 预编译对象数据 */
    async precompile() {
        await this.attribute;
        await this.enumeration;
        Attribute.initialize();
        Enum.initialize();
        this.precompileScenes();
        this.precompileActors();
        this.precompileSkills();
        this.precompileTriggers();
        this.precompileItems();
        this.precompileEquipments();
        this.precompileStates();
        this.precompileAnimations();
    }
    /** 遍历继承父级数据 */
    inheritForEach(files, handler) {
        const flags = new Set();
        while (files.length !== 0) {
            let i = files.length;
            while (--i >= 0) {
                const file = files[i];
                const parent = file.parent;
                if (parent === undefined) {
                    files.splice(i, 1);
                    flags.add(file);
                    continue;
                }
                if (flags.has(parent)) {
                    handler(file);
                    files.splice(i, 1);
                    flags.add(file);
                    continue;
                }
            }
        }
    }
    /** 通过关键属性合并列表数据 */
    mergeArrayByProperty(a, b, key) {
        const map = {};
        for (const item of a) {
            const id = item[key];
            map[id] = true;
        }
        for (const item of b) {
            const id = item[key];
            if (id in map)
                continue;
            map[id] = true;
            a.push(item);
        }
    }
    /** 预编译场景数据 */
    precompileScenes() {
        for (const scene of Object.values(this.scenes)) {
            this.compileEvents(scene, scene.path);
        }
    }
    /** 预编译角色数据 */
    precompileActors() {
        const actors = Object.values(this.actors);
        for (const actor of actors) {
            actor.idleMotion = Enum.getValue(actor.idleMotion);
            actor.moveMotion = Enum.getValue(actor.moveMotion);
            this.compileEvents(actor, actor.path);
            this.setParentActor(actor);
        }
        this.inheritForEach(actors, this.inheritActor);
    }
    /** 设置父级角色的引用 */
    setParentActor(actor) {
        if (actor.inherit !== '' && actor.inherit !== actor.id) {
            const parent = Data.actors[actor.inherit];
            if (parent !== undefined) {
                actor.parent = parent;
            }
        }
    }
    /** 继承父级角色的数据 */
    inheritActor(actor) {
        if (actor.parent) {
            Data.mergeArrayByProperty(actor.attributes, actor.parent.attributes, 'key');
            Data.mergeArrayByProperty(actor.skills, actor.parent.skills, 'id');
            Data.mergeArrayByProperty(actor.equipments, actor.parent.equipments, 'slot');
            actor.inventory = actor.parent.inventory.concat(actor.inventory);
            Object.setPrototypeOf(actor.events, actor.parent.events);
            Data.mergeScripts(actor.scripts, actor.parent.scripts);
        }
    }
    /** 过滤重复脚本 */
    filterScripts(scripts) {
        const flags = {};
        for (let i = scripts.length - 1; i >= 0; i--) {
            const script = scripts[i];
            if (!flags[script.id]) {
                flags[script.id] = true;
            }
            else {
                scripts.splice(i, 1);
            }
        }
    }
    /** 合并脚本列表 */
    mergeScripts(childScripts, parentScripts) {
        const flags = {};
        for (let i = childScripts.length - 1; i >= 0; i--) {
            const script = childScripts[i];
            if (!flags[script.id]) {
                flags[script.id] = true;
            }
            else {
                childScripts.splice(i, 1);
            }
        }
        for (let i = parentScripts.length - 1; i >= 0; i--) {
            const script = parentScripts[i];
            if (!flags[script.id]) {
                flags[script.id] = true;
                childScripts.unshift(script);
            }
        }
    }
    /** 预编译技能数据 */
    precompileSkills() {
        const skills = Object.values(this.skills);
        for (const skill of skills) {
            this.compileEvents(skill, skill.path);
            this.setParentSkill(skill);
        }
        this.inheritForEach(skills, this.inheritSkill);
    }
    /** 设置父级技能的引用 */
    setParentSkill(skill) {
        if (skill.inherit !== '' && skill.inherit !== skill.id) {
            const parent = Data.skills[skill.inherit];
            if (parent !== undefined) {
                skill.parent = parent;
            }
        }
    }
    /** 继承父级技能的数据 */
    inheritSkill(skill) {
        if (skill.parent) {
            Data.mergeArrayByProperty(skill.attributes, skill.parent.attributes, 'key');
            Object.setPrototypeOf(skill.events, skill.parent.events);
            Data.mergeScripts(skill.scripts, skill.parent.scripts);
        }
    }
    /** 预编译触发器数据 */
    precompileTriggers() {
        const triggers = Object.values(this.triggers);
        for (const trigger of triggers) {
            trigger.motion = Enum.getValue(trigger.motion);
            this.compileEvents(trigger, trigger.path);
            this.setParentTrigger(trigger);
        }
        this.inheritForEach(triggers, this.inheritTrigger);
    }
    /** 设置父级触发器的引用 */
    setParentTrigger(trigger) {
        if (trigger.inherit !== '' && trigger.inherit !== trigger.id) {
            const parent = Data.triggers[trigger.inherit];
            if (parent !== undefined) {
                trigger.parent = parent;
            }
        }
    }
    /** 继承父级触发器的数据 */
    inheritTrigger(trigger) {
        if (trigger.parent) {
            Object.setPrototypeOf(trigger.events, trigger.parent.events);
            Data.mergeScripts(trigger.scripts, trigger.parent.scripts);
        }
    }
    /** 预编译物品数据 */
    precompileItems() {
        const items = Object.values(this.items);
        for (const item of items) {
            this.compileEvents(item, item.path);
            this.setParentItem(item);
        }
        this.inheritForEach(items, this.inheritItem);
        // 重新获取物品列表，生成属性表
        for (const item of Object.values(this.items)) {
            const attributes = item.attributes;
            Attribute.loadEntries(item.attributes = {}, attributes);
        }
    }
    /** 设置父级物品的引用 */
    setParentItem(item) {
        if (item.inherit !== '' && item.inherit !== item.id) {
            const parent = Data.items[item.inherit];
            if (parent !== undefined) {
                item.parent = parent;
            }
        }
    }
    /** 继承父级物品的数据 */
    inheritItem(item) {
        if (item.parent) {
            Data.mergeArrayByProperty(item.attributes, item.parent.attributes, 'key');
            Object.setPrototypeOf(item.events, item.parent.events);
            Data.mergeScripts(item.scripts, item.parent.scripts);
        }
    }
    /** 预编译装备数据 */
    precompileEquipments() {
        const equipments = Object.values(this.equipments);
        for (const equipment of equipments) {
            this.compileEvents(equipment, equipment.path);
            this.setParentEquipment(equipment);
        }
        this.inheritForEach(equipments, this.inheritEquipment);
    }
    /** 设置父级装备的引用 */
    setParentEquipment(equipment) {
        if (equipment.inherit !== '' && equipment.inherit !== equipment.id) {
            const parent = Data.equipments[equipment.inherit];
            if (parent !== undefined) {
                equipment.parent = parent;
            }
        }
    }
    /** 继承父级装备的数据 */
    inheritEquipment(equipment) {
        if (equipment.parent) {
            Data.mergeArrayByProperty(equipment.attributes, equipment.parent.attributes, 'key');
            Object.setPrototypeOf(equipment.events, equipment.parent.events);
            Data.mergeScripts(equipment.scripts, equipment.parent.scripts);
        }
    }
    /** 预编译状态数据 */
    precompileStates() {
        const states = Object.values(this.states);
        for (const state of states) {
            this.compileEvents(state, state.path);
            this.setParentState(state);
        }
        this.inheritForEach(states, this.inheritState);
    }
    /** 设置父级状态的引用 */
    setParentState(state) {
        if (state.inherit !== '' && state.inherit !== state.id) {
            const parent = Data.states[state.inherit];
            if (parent !== undefined) {
                state.parent = parent;
            }
        }
    }
    /** 继承父级状态的数据 */
    inheritState(state) {
        if (state.parent) {
            Data.mergeArrayByProperty(state.attributes, state.parent.attributes, 'key');
            Object.setPrototypeOf(state.events, state.parent.events);
            Data.mergeScripts(state.scripts, state.parent.scripts);
        }
    }
    /** 预编译动画数据 */
    precompileAnimations() {
        // 计算动画当前动作的帧数
        const calculateLength = (layers, length) => {
            // 遍历所有图层的尾帧，获取最大长度
            for (const layer of layers) {
                const frames = layer.frames;
                const frame = frames[frames.length - 1];
                if (frame !== undefined) {
                    length = Math.max(length, frame.end);
                }
                if (layer.class === 'joint') {
                    length = calculateLength(layer.children, length);
                }
            }
            return length;
        };
        for (const animation of Object.values(this.animations)) {
            // 加载动作哈希表
            const motionMap = {};
            for (const motion of animation.motions) {
                // 设置动作名称
                motion.name = Enum.get(motion.id)?.value ?? motion.id;
                // 添加当前动作的方向映射列表
                motion.dirList = AnimationPlayer.dirListMap[motion.mode];
                // 计算当前动作的动画帧数和循环起始位置
                for (const dirCase of motion.dirCases) {
                    const length = calculateLength(dirCase.layers, 0);
                    const lastFrame = length - 1;
                    dirCase.loopStart = motion.loop ? Math.min(motion.loopStart, lastFrame) : 0;
                    dirCase.length = motion.skip && dirCase.loopStart < lastFrame ? lastFrame : length;
                }
                // 添加动作到映射表中
                motionMap[motion.name] = motion;
            }
            // 加载精灵哈希表
            const spriteMap = {};
            const imageMap = {};
            // 使用精灵数组生成精灵和图像哈希表
            for (const sprite of animation.sprites) {
                spriteMap[sprite.id] = sprite;
                imageMap[sprite.id] = sprite.image;
            }
            // 将动作列表替换为{名称:动作数据}映射表
            animation.motions = motionMap;
            // 将精灵列表替换为{精灵ID:精灵图数据}映射表
            animation.sprites = spriteMap;
            // 添加{精灵ID:图像ID}映射表
            animation.images = imageMap;
        }
    }
    /** 加载脚本文件(动态导入模块) */
    async loadScripts() {
        this.remapScripts();
        const promises = [];
        const scripts = this.scripts = {};
        // 动态导入所有脚本文件
        for (const meta of this.manifest.script) {
            const promise = import(`../../${meta.path}`);
            promise.meta = meta;
            promises.push(promise);
        }
        for (const promise of promises) {
            try {
                // 等待导入完成，获取构造函数
                const module = await promise;
                const constructor = module.default;
                if (typeof constructor === 'function') {
                    const { meta } = promise;
                    constructor.guid = meta.guid;
                    scripts[meta.guid] = {
                        constructor: constructor,
                        parameters: meta.parameters ?? [],
                    };
                }
            }
            catch (error) {
                console.error(error);
            }
        }
    }
    /** 重新映射脚本路径(TS->JS) */
    remapScripts() {
        if (this.config.deployed)
            return;
        const tsExtname = /\.ts$/;
        const tsOutDir = this.tsOutDir;
        for (const meta of this.manifest.script) {
            if (tsExtname.test(meta.path)) {
                meta.path = tsOutDir + meta.path.replace(tsExtname, '.js');
            }
        }
    }
    /**
     * 加载文件
     * @param filename /data目录下的文件名
     * @returns 文件数据
     */
    async loadFile(filename) {
        const promise = Loader.get({
            path: `Data/${filename}.json`,
            type: 'json',
        }).then(data => {
            this[filename] = data;
        });
        await (this[filename] = promise);
    }
    /**
     * 写入文件(Electron)
     * @param filePath 文件路径
     * @param content 数据内容
     * @returns 等待操作结束
     */
    async writeFile(filePath, content) {
        return require('electron').ipcRenderer.invoke('write-file', filePath, content);
    }
    /**
     * 获取场景数据
     * @param id 场景文件ID
     * @returns 场景数据
     */
    getScene(id) {
        const scene = this.scenes[id];
        if (scene)
            return scene;
        throw new URIError(`Scene #${id} is missing.`);
    }
    /**
     * 从元数据中解析文件GUID
     * @param meta 文件的元数据
     * @returns 文件GUID
     */
    parseGUID(meta) {
        const match = meta.path.match(this.fileGuidRegExp);
        return match ? match[1] : '';
    }
    /** 创建自动图块模板数据映射表 */
    createAutotileMap() {
        const autotiles = {};
        for (const item of this.autotiles) {
            autotiles[item.id] = item;
        }
        this.autotiles = autotiles;
    }
    /** 创建过渡映射表 */
    createEasingMap() {
        const easings = {};
        const keyRemap = {};
        for (const item of this.easings) {
            easings[item.id] = item;
            keyRemap[item.id] = item.id;
            if (item.key) {
                keyRemap[item.key] = item.id;
            }
        }
        this.easings = easings;
    }
    /**
     * 编译对象中的事件
     * @param data 包含事件列表的对象
     * @param eventPath 事件路径
     * @returns (类型:指令列表)映射表
     */
    compileEvents(data, eventPath) {
        const typeMap = {};
        for (const event of data.events) {
            if (!event.enabled)
                continue;
            let eventName;
            let eventType;
            const enumItem = Enum.get(event.type);
            if (enumItem) {
                eventName = enumItem.name;
                eventType = enumItem.value;
            }
            else {
                eventName = event.type;
                eventType = event.type;
            }
            event.commands.path = `@ ${eventPath}\n@ ${eventName}`;
            const commandFunctions = Command.compile(event.commands);
            commandFunctions.type = eventType;
            commandFunctions.path = `${eventPath}/${eventName}`;
            typeMap[eventType] = commandFunctions;
        }
        return data.events = typeMap;
    }
    /**
     * 保存游戏数据到文件
     * @param index 存档编号
     * @param meta 存档元数据(时间、地点、截图等附加数据)
     */
    async saveGameData(index, meta) {
        const suffix = index.toString().padStart(2, '0');
        const data = {
            playTime: Time.playTime,
            actors: ActorManager.saveData(),
            party: Party.saveData(),
            team: Team.saveData(),
            scene: Scene.saveData(),
            camera: Camera.saveData(),
            variables: Variable.saveData(0),
            selfVariables: SelfVariable.saveData(),
        };
        switch (Stats.shell) {
            case 'electron': {
                const saveDir = Loader.routeSave('Save');
                const metaPath = Loader.routeSave(`Save/save${suffix}.meta`);
                const dataPath = Loader.routeSave(`Save/save${suffix}.save`);
                const metaText = Stats.debug
                    ? JSON.stringify(meta, null, 2)
                    : JSON.stringify(meta);
                const dataText = Stats.debug
                    ? JSON.stringify(data, null, 2)
                    : JSON.stringify(data);
                const fsp = require('fs').promises;
                // 如果不存在存档文件夹，创建它
                try {
                    await fsp.stat(saveDir);
                }
                catch (error) {
                    await fsp.mkdir(saveDir, { recursive: true });
                }
                // 异步写入元数据和存档数据
                await Promise.all([
                    Data.writeFile(metaPath, metaText).catch((error) => { console.warn(error); }),
                    Data.writeFile(dataPath, dataText).catch((error) => { console.warn(error); }),
                ]);
                break;
            }
            case 'browser': {
                const metaKey = `save${suffix}.meta`;
                const dataKey = `save${suffix}.save`;
                await Promise.all([
                    IDB.setItem(metaKey, meta),
                    IDB.setItem(dataKey, data),
                ]);
                break;
            }
        }
    }
    /**
     * 从文件中加载游戏数据
     * @param index 存档编号
     */
    async loadGameData(index) {
        const suffix = index.toString().padStart(2, '0');
        let data;
        switch (Stats.shell) {
            case 'electron':
                // 推迟到栈尾执行
                await Promise.resolve();
                try {
                    // 同步读取存档数据文件
                    const path = Loader.routeSave(`Save/save${suffix}.save`);
                    const json = require('fs').readFileSync(path);
                    data = JSON.parse(json);
                }
                catch (error) {
                    console.warn(error);
                    return;
                }
                break;
            case 'browser': {
                const key = `save${suffix}.save`;
                data = await IDB.getItem(key);
                break;
            }
        }
        Game.reset();
        Time.playTime = data.playTime;
        ActorManager.loadData(data.actors);
        Party.loadData(data.party);
        Team.loadData(data.team);
        Scene.loadData(data.scene);
        Camera.loadData(data.camera);
        Variable.loadData(0, data.variables);
        SelfVariable.loadData(data.selfVariables);
        EventManager.emit('loadsave');
    }
    /**
     * 加载存档元数据列表
     * @returns 存档元数据列表
     */
    async loadSaveMeta() {
        const filenames = [];
        const promises = [];
        const metaname = /^save\d{2}\.meta$/;
        const extname = /\.meta$/;
        switch (Stats.shell) {
            case 'electron': {
                const saveDir = Loader.routeSave('Save');
                const fsp = require('fs').promises;
                // 如果不存在存档文件夹，获取空文件列表
                const files = await fsp.readdir(saveDir, { withFileTypes: true }).catch((error) => []);
                for (const file of files) {
                    // 获取所有的meta文件名
                    if (file.isFile() && metaname.test(file.name)) {
                        filenames.push(file.name);
                    }
                }
                // 加载所有meta文件
                for (const filename of filenames) {
                    const filepath = Loader.routeSave(`Save/${filename}`);
                    promises.push(fsp.readFile(filepath, 'utf8').then((string) => JSON.parse(string)));
                }
                break;
            }
            case 'browser':
                for (const key of await IDB.getKeys()) {
                    if (metaname.test(key)) {
                        filenames.push(key);
                    }
                }
                for (const filename of filenames.sort()) {
                    promises.push(IDB.getItem(filename));
                }
                break;
        }
        return Promise.all(promises).then(data => {
            const list = [];
            const length = data.length;
            for (let i = 0; i < length; i++) {
                // 如果meta数据有效，添加到列表中返回
                if (data[i]) {
                    const name = filenames[i].replace(extname, '');
                    const index = parseInt(name.slice(-2));
                    list.push({
                        index: index,
                        name: name,
                        data: data[i],
                    });
                }
            }
            return list;
        });
    }
    /**
     * 删除游戏数据存档文件
     * @param index 存档编号
     */
    async deleteGameData(index) {
        const suffix = index.toString().padStart(2, '0');
        switch (Stats.shell) {
            case 'electron': {
                const metaPath = Loader.routeSave(`Save/save${suffix}.meta`);
                const dataPath = Loader.routeSave(`Save/save${suffix}.save`);
                const fsp = require('fs').promises;
                await Promise.all([
                    // 异步删除元数据和存档数据
                    fsp.unlink(metaPath).catch((error) => { console.warn(error); }),
                    fsp.unlink(dataPath).catch((error) => { console.warn(error); }),
                ]);
                break;
            }
            case 'browser': {
                const metaKey = `save${suffix}.meta`;
                const dataKey = `save${suffix}.save`;
                await Promise.all([
                    IDB.removeItem(metaKey),
                    IDB.removeItem(dataKey),
                ]);
                break;
            }
        }
    }
    /**
     * 保存全局数据到文件
     */
    async saveGlobalData() {
        const data = {
            language: Local.language,
            canvasWidth: Stage.width,
            canvasHeight: Stage.height,
            sceneScale: Scene.scale,
            uiScale: UI.scale,
            variables: Variable.saveData(1),
        };
        switch (Stats.shell) {
            case 'electron': {
                const fs = require('fs');
                const saveDir = Loader.routeSave('Save');
                const savePath = Loader.routeSave('Save/global.save');
                // 调试模式下输出格式化的JSON
                // 发布模式下输出压缩后的JSON
                const json = Stats.debug
                    ? JSON.stringify(data, null, 2)
                    : JSON.stringify(data);
                // 如果不存在存档文件夹，创建它
                if (!fs.existsSync(saveDir)) {
                    fs.mkdirSync(saveDir, { recursive: true });
                }
                // 写入全局数据到缓存文件
                await Data.writeFile(savePath, json);
                break;
            }
            case 'browser': {
                const key = 'global.save';
                await IDB.setItem(key, data);
                break;
            }
        }
    }
    /**
     * 从文件中加载全局数据
     */
    async loadGlobalData() {
        switch (Stats.shell) {
            case 'electron':
                try {
                    // 读取数据文件
                    const fsp = require('fs').promises;
                    const path = Loader.routeSave('Save/global.save');
                    const json = await fsp.readFile(path);
                    this.globalData = JSON.parse(json);
                }
                catch (error) {
                    // 不存在全局存档
                }
                break;
            case 'browser':
                this.globalData = await IDB.getItem('global.save');
                break;
        }
        // 创建默认全局数据
        const defaultData = {
            language: this.config.localization.default,
            canvasWidth: this.config.resolution.width,
            canvasHeight: this.config.resolution.height,
            sceneScale: this.config.resolution.sceneScale,
            uiScale: this.config.resolution.uiScale,
            variables: {},
        };
        // 如果存在全局数据，检查并修补缺失的属性
        // 否则使用默认全局数据
        if (this.globalData) {
            const globalData = this.globalData;
            for (const key of Object.keys(defaultData)) {
                if (globalData[key] === undefined) {
                    globalData[key] = defaultData[key];
                }
            }
            // 以调试模式运行时重置部分数据
            if (Stats.debug) {
                for (const key of [
                    'language',
                    'canvasWidth',
                    'canvasHeight',
                    'sceneScale',
                    'uiScale'
                ]) {
                    globalData[key] = defaultData[key];
                }
            }
        }
        else {
            this.globalData = defaultData;
        }
    }
    /**
     * 加载配置文件
     */
    async loadConfig() {
        this.config = await Loader.get({
            path: 'Data/config.json',
            type: 'json',
        });
    }
    /**
     * 加载TS配置文件
     */
    async loadTSConfig() {
        if (!this.config.deployed) {
            const tsconfig = await Loader.get({
                path: 'tsconfig.json',
                type: 'text',
            });
            const match = tsconfig.match(/"outDir"\s*:\s*"(.*?)"/);
            if (!match) {
                throw new Error('Unable to get "outDir" from "tsconfig.json".');
            }
            this.tsOutDir = match[1];
            if (!/\/$/.test(this.tsOutDir)) {
                this.tsOutDir += '/';
            }
        }
    }
    /**
     * 加载存档目录路径(Node.js)
     */
    async loadSaveDirPath() {
        if (Stats.shell === 'electron') {
            const { location, subdir } = this.config.save;
            if (location === 'local') {
                this.saveDir = __dirname;
            }
            else {
                const dirname = await require('electron').ipcRenderer
                    .invoke('get-dir-path', location);
                const folder = this.sanitizeFolderName(subdir);
                this.saveDir = require('path').resolve(dirname, folder);
            }
        }
    }
    /**
     * 规范化文件夹名称
     * @param name 文件夹名称
     * @returns 过滤非法字符后的名称
     */
    sanitizeFolderName(name) {
        // 移除Windows/macOS/Linux不允许的字符
        name = name.replace(/[\/:*?"<>|]/g, "");
        // 去掉开头和结尾的空格
        name = name.replace(/^\s+|\s+$/g, "");
        // Windows不能以"."结尾
        name = name.replace(/\.$/, "");
        // 避免Windows设备名（不区分大小写）
        const reservedNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
        if (reservedNames.test(name)) {
            // 添加后缀以避免冲突
            name += "_safe";
        }
        // 避免空字符串
        return name || "default_folder";
    }
};
/** ******************************** 索引数据库管理器 ******************************** */
let IDB = new class IDBManager {
    /** 数据库Promise */
    promise;
    /**
     * 打开数据库
     * @returns 对象存储空间
     */
    async open() {
        if (!this.promise) {
            // localStorage数据容量有限，indexedDB可以存放大量数据
            const dbName = 'yami-rpg:' + Data.config.gameId;
            const request = indexedDB.open(dbName);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                db.createObjectStore('game-data', { keyPath: 'key' });
            };
            this.promise = new Promise(resolve => {
                request.onsuccess = (event) => {
                    resolve(event.target.result);
                };
            });
        }
        const db = await this.promise;
        const transaction = db.transaction(['game-data'], 'readwrite');
        return transaction.objectStore('game-data');
    }
    /**
     * 获取所有数据键(游戏存档文件名)
     * @returns 键列表
     */
    async getKeys() {
        return new Promise(resolve => {
            this.open().then(objectStore => {
                const request = objectStore.getAllKeys();
                request.onsuccess = (event) => {
                    resolve(event.target.result);
                };
            });
        });
    }
    /**
     * 获取数据内容
     * @param key 键(存档文件名)
     * @returns 读取的数据
     */
    async getItem(key) {
        return new Promise(resolve => {
            this.open().then(objectStore => {
                const request = objectStore.get(key);
                request.onsuccess = (event) => {
                    resolve(event.target.result?.value);
                };
            });
        });
    }
    /**
     * 设置数据内容
     * @param key 键(存档文件名)
     * @param value 写入的数据
     */
    async setItem(key, value) {
        return new Promise(resolve => {
            this.open().then(objectStore => {
                const request = objectStore.put({ key, value });
                request.onsuccess = event => {
                    resolve();
                };
            });
        });
    }
    /**
     * 移除数据内容
     * @param key 键(存档文件名)
     */
    async removeItem(key) {
        return new Promise(resolve => {
            this.open().then(objectStore => {
                const request = objectStore.delete(key);
                request.onsuccess = event => {
                    resolve();
                };
            });
        });
    }
};
//# sourceMappingURL=data.js.map