/** ******************************** 游戏管理器 ******************************** */
let Game = new class GameManager {
    /** 游戏更新器列表 */
    updaters = new UpdaterList();
    /** 游戏渲染器列表 */
    renderers = new RendererList();
    /** 游戏事件侦听器列表 */
    listeners = {
        ready: [],
        reset: [],
        quit: [],
    };
    /** 游戏是否处于暂停状态 */
    paused = false;
    /** 游戏暂停计数(0:继续;>0:暂停) */
    pauseCount = 0;
    /** {键:布尔值}标记映射表 */
    flags = {};
    /** 延时处理器 */
    defer = Promise.resolve();
    /** 初始化游戏 */
    async initialize() {
        // 注册退出事件
        Game.registerExitEvent();
        // 加载配置和全局数据文件
        await Data.loadConfig();
        await Promise.all([
            Data.loadTSConfig(),
            Data.loadSaveDirPath(),
        ]);
        await Data.loadGlobalData();
        // 创建GL上下文
        GLBuilder.initialize();
        // 优先初始化以下内容
        await Promise.all([
            Stage.initialize(),
            Data.loadMeta(),
            Time.initialize(),
            Game.loop(Time.timestamp),
        ]);
        // 加载数据和默认字体
        await Promise.all([
            Data.initialize(),
            Printer.initialize(),
        ]);
        // 设置更新器(按顺序更新每一帧)
        Game.updaters = new UpdaterList(Callback, Input, Timer, Scene, EventManager, UI, AudioManager, CacheList, Callback);
        // 设置渲染器(按顺序渲染每一帧)
        Game.renderers = new RendererList(OffscreenStart, Scene, OffscreenEnd, UI);
        // 初始化组件对象
        Local.initialize();
        Input.initialize();
        Mouse.initialize();
        Controller.initialize();
        VirtualAxis.initialize();
        UI.initialize();
        Scene.initialize();
        Camera.initialize();
        PathFinder.initialize();
        Actor.initialize();
        ActorCollider.initialize();
        AnimationPlayer.initialize();
        ParticleLayer.initialize();
        Trigger.initialize();
        Team.initialize();
        Easing.initialize();
        Variable.initialize();
        Command.initialize();
        AudioManager.initialize();
        EventManager.initialize();
        PluginManager.initialize();
        MessageReporter.initialize();
        // 触发ready事件
        Game.emit('ready');
        // 开始游戏
        Game.start();
    }
    /**
     * 游戏循环
     * @param timestamp 增量时间(毫秒)
     */
    loop(timestamp) {
        // 请求下一帧
        requestAnimationFrame(Game.loop);
        // 更新时间
        Time.update(timestamp);
        // 防止Firefox隐藏时运行
        if (document.hidden) {
            return;
        }
        // 如果正在同步加载数据
        // 渲染加载进度条并返回
        if (Loader.updateLoadingProgress()) {
            return Loader.renderLoadingProgress();
        }
        // 更新数据
        Game.update();
        // 渲染图形
        Game.render();
        // 清除数据
        Game.clear();
    }
    /** 更新游戏数据 */
    update() {
        Game.updaters.update(Time.deltaTime);
    }
    /** 渲染游戏画面 */
    render() {
        Game.defer.then(Game.deferredRendering);
    }
    /** 延时渲染 */
    deferredRendering() {
        Game.renderers.render();
    }
    /** 清除数据 */
    clear() {
        Input.clearTempInputStatus();
    }
    /** 重置游戏 */
    reset() {
        this.pauseCount = 0;
        this.paused = false;
        // 重置相关组件
        Time.reset();
        UI.reset();
        Scene.reset();
        Camera.reset();
        ScreenTinter.reset();
        Variable.reset();
        SelfVariable.reset();
        AudioManager.reset();
        EventManager.reset();
        ActorManager.reset();
        Party.reset();
        // 触发reset事件
        Game.emit('reset');
    }
    /** 开始游戏 */
    start() {
        EventManager.emit('startup');
        EventManager.emit('autorun');
    }
    /** 暂停游戏 */
    pause() {
        this.pauseCount++;
        this.paused = true;
    }
    /** 继续游戏 */
    continue() {
        if (--this.pauseCount <= 0) {
            this.pauseCount = 0;
            this.paused = false;
        }
    }
    /**
     * 添加游戏事件侦听器
     * @param type 游戏事件类型
     * @param listener 回调函数
     */
    on(type, listener) {
        this.listeners[type].append(listener);
    }
    /**
     * 发送游戏事件
     * @param type 游戏事件类型
     */
    emit(type) {
        for (const listener of this.listeners[type]) {
            listener();
        }
    }
    /**
     * 查询是否设置过这个标记
     * @param key 键
     * @returns 是否设置过
     */
    getFlag(key) {
        return this.flags[key] ?? false;
    }
    /**
     * 设置指定名称的标记
     * @param key 键
     * @returns 操作是否成功
     */
    setFlag(key) {
        if (key in this.flags) {
            return false;
        }
        this.flags[key] = true;
        return true;
    }
    /**
     * 注册退出事件
     */
    registerExitEvent() {
        if (Stats.isOnClient) {
            // Electron本地模式
            const { ipcRenderer } = require('electron');
            ipcRenderer.on('before-close-window', () => {
                Game.emit('quit');
                ipcRenderer.send('force-close-window');
            });
        }
        else {
            // Web模式(刷新页面也会触发)
            window.on('beforeunload', event => {
                Game.emit('quit');
            });
        }
    }
    /** 开关游戏信息显示面板 */
    switchGameInfoDisplay() {
        if (!GL.container.info) {
            // 创建统计信息元素
            const info = document.createElement('div');
            info.style.position = 'absolute';
            info.style.padding = '4px';
            info.style.left = '0';
            info.style.top = '0';
            info.style.font = '12px sans-serif';
            info.style.color = 'white';
            info.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            info.style.pointerEvents = 'none';
            info.style.userSelect = 'none';
            info.style.whiteSpace = 'pre';
            let elapsed = 1000;
            // 创建渲染器
            info.renderer = {
                render: () => {
                    elapsed += Time.rawDeltaTime;
                    if (elapsed > 995) {
                        elapsed = 0;
                        // 每秒刷新统计信息文本(可见对象数量只有在渲染时才能获取)
                        info.textContent = `${GL.width}x${GL.height}`
                            + `\nFPS ${Time.fps}`
                            + `\nActors ${Scene.visibleActors.count}/${Scene.actor.list.length}`
                            + `\nAnims ${Scene.visibleAnimations.count}/${Scene.animation.list.length}`
                            + `\nTriggers ${Scene.visibleTriggers.count}/${Scene.trigger.list.length}`
                            + `\nParticles ${Scene.particleCount}`
                            + `\nElements ${UI.manager.list.length}`
                            + `\nTextures ${GL.textureManager.count}`;
                    }
                }
            };
            // 开启：添加统计信息元素和渲染器
            GL.container.info = info;
            document.body.appendChild(info);
            Game.renderers.add(info.renderer);
            // 立即调用一次渲染方法
            info.renderer.render();
        }
        else {
            // 关闭：移除统计信息元素和渲染器
            document.body.removeChild(GL.container.info);
            Game.renderers.remove(GL.container.info.renderer);
            delete GL.container.info;
        }
    }
};
/** ******************************** 初始化游戏 ******************************** */
Game.initialize();
//# sourceMappingURL=main.js.map