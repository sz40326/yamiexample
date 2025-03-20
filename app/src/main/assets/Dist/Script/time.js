// ******************************** 游戏时间对象 ********************************
let Time = new class TimeManager {
    /** 时间戳 */
    timestamp = 0;
    /** 时间缩放率 */
    timeScale = 1;
    /** 已过去时间 */
    elapsed = 0;
    /** 累计游戏时间 */
    playTime = 0;
    /** 增量时间 */
    deltaTime = 0;
    /** 原生增量时间 */
    rawDeltaTime = 0;
    /** 最大增量时间 */
    maxDeltaTime = 35;
    /** 短期累计帧数 */
    frameCount = 0;
    /** 短期累计帧时间 */
    frameTime = 0;
    /** 每秒游戏帧数 */
    fps = 0;
    /** 平均每帧游戏时间 */
    tpf = Infinity;
    // 游戏速度过渡结束后回调
    callbacks = null;
    // 游戏速度过渡上下文
    transition = null;
    /** 初始化游戏时间管理器 */
    initialize() {
        this.timestamp = performance.now();
    }
    /** 重置游戏时间管理器 */
    reset() {
        this.timeScale = 1;
        this.playTime = 0;
        this.callbacks = null;
        this.transition = null;
    }
    /**
     * 更新当前帧的时间相关参数
     * @param timestamp 增量时间(毫秒)
     */
    update(timestamp) {
        let deltaTime = timestamp - this.timestamp;
        // 累计帧数和所用时间
        this.frameCount++;
        this.frameTime += deltaTime;
        // 每秒计算FPS
        if (this.frameTime > 995) {
            this.fps = Math.round(this.frameCount / (this.frameTime / 1000));
            this.tpf = this.frameTime / this.frameCount;
            this.frameCount = 0;
            this.frameTime = 0;
        }
        // 限制增量时间 - 发生跳帧时减少视觉上的落差
        deltaTime = Math.min(deltaTime, this.tpf + 1, this.maxDeltaTime);
        // 计算游戏速度改变时的过渡
        const _transition = this.transition;
        if (_transition !== null) {
            _transition.elapsed = Math.min(_transition.elapsed + deltaTime, _transition.duration);
            const { start, end, easing, elapsed, duration } = _transition;
            const time = easing.get(elapsed / duration);
            this.timeScale = start * (1 - time) + end * time;
            // 过渡结束后执行回调
            if (elapsed === duration) {
                this.transition = null;
                this.executeCallbacks();
            }
        }
        // 更新时间属性
        this.timestamp = timestamp;
        this.deltaTime = this.timeScale * deltaTime;
        this.rawDeltaTime = deltaTime;
        this.elapsed += this.deltaTime;
        this.playTime += deltaTime;
    }
    /**
     * 设置增量时间缩放比例
     * @param timeScale 增量时间缩放比例
     * @param easingId 过渡曲线ID
     * @param duration 持续时间(毫秒)
     */
    setTimeScale(timeScale, easingId = '', duration = 0) {
        if (duration > 0) {
            // 过渡模式
            this.transition = {
                start: this.timeScale,
                end: timeScale,
                easing: Easing.get(easingId),
                elapsed: 0,
                duration: duration,
            };
        }
        else {
            // 立即模式
            this.timeScale = timeScale;
            this.transition = null;
            this.executeCallbacks();
        }
    }
    /**
     * 解析日期时间戳
     * @param timestamp 时间戳
     * @param format 日期格式
     * @returns 格式化的日期
     */
    parseDateTimestamp(timestamp, format) {
        const date = new Date(timestamp);
        return format.replace(/\{[YMDhms]\}/g, (match) => {
            switch (match) {
                case '{Y}': return date.getFullYear().toString();
                case '{M}': return date.getMonth() + 1 + '';
                case '{D}': return date.getDate().toString();
                case '{h}': return date.getHours().toString().padStart(2, '0');
                case '{m}': return date.getMinutes().toString().padStart(2, '0');
                case '{s}': return date.getSeconds().toString().padStart(2, '0');
                default: return '';
            }
        });
    }
    /**
     * 设置时间缩放过渡结束回调
     * @param callback 回调函数
     */
    onTransitionEnd(callback) {
        if (this.callbacks !== null) {
            this.callbacks.push(callback);
        }
        else {
            this.callbacks = [callback];
        }
    }
    /** 执行时间缩放过渡结束回调 */
    executeCallbacks() {
        if (this.callbacks !== null) {
            for (const callback of this.callbacks) {
                callback();
            }
            this.callbacks = null;
        }
    }
};
// ******************************** 计时器 ********************************
class Timer {
    /** 计时器当前时间 */
    elapsed;
    /** 计时器持续时间 */
    duration;
    /** 计时器模式 */
    mode;
    /** 计时器更新函数 */
    update;
    /** 计时器结束回调函数 */
    callback;
    /** 计时器对象 */
    constructor(options) {
        this.elapsed = 0;
        this.duration = options.duration;
        this.mode = options.mode ?? 'scaled';
        this.update = options.update ?? Function.empty;
        this.callback = options.callback ?? Function.empty;
    }
    /**
     * 执行周期回调函数
     * @param deltaTime 增量时间(毫秒)
     */
    tick(deltaTime) {
        this.elapsed = Math.min(this.elapsed + deltaTime, this.duration);
        this.update(this);
        if (this.elapsed === this.duration) {
            this.callback(this);
            this.remove();
        }
    }
    /**
     * 添加计时器到列表
     * @returns 当前计时器
     */
    add() {
        switch (this.mode) {
            case 'scaled':
                Timer.scaledTimers.append(this);
                return this;
            case 'raw':
                Timer.rawTimers.append(this);
                return this;
        }
    }
    /**
     * 从列表中移除计时器
     * @returns 当前计时器
     */
    remove() {
        switch (this.mode) {
            case 'scaled':
                Timer.scaledTimers.remove(this);
                return this;
            case 'raw':
                Timer.rawTimers.remove(this);
                return this;
        }
    }
    /** 计时器列表 */
    static scaledTimers = [];
    /** 计时器列表(原生时间) */
    static rawTimers = [];
    /** 备用的计时器对象池 */
    static timerPool = new CacheList();
    /**
     * 更新计时器
     * @param deltaTime 增量时间(毫秒)
     */
    static update(deltaTime) {
        // 更新缩放时间的计时器
        if (Game.paused === false) {
            const { scaledTimers } = this;
            let i = scaledTimers.length;
            while (--i >= 0) {
                scaledTimers[i].tick(deltaTime);
            }
        }
        // 更新原生时间的计时器
        {
            const { rawTimers } = this;
            const { rawDeltaTime } = Time;
            let i = rawTimers.length;
            while (--i >= 0) {
                rawTimers[i].tick(rawDeltaTime);
            }
        }
    }
    /**
     * 从对象池中取出计时器实例
     * @returns 计时器实例
     */
    static fetch() {
        const timers = this.timerPool;
        return timers.count !== 0
            ? timers[--timers.count]
            : new Timer({ duration: 0 });
    }
    /**
     * 回收计时器实例到对象池
     * @param timer 计时器实例
     */
    static recycle(timer) {
        const timers = this.timerPool;
        if (timers.count < 100000) {
            timers[timers.count++] = timer;
            timer.elapsed = 0;
            timer.update = Function.empty;
            timer.callback = Function.empty;
        }
    }
}
// ******************************** 过渡曲线管理器 ********************************
let Easing = new class EasingManager {
    /** 过渡曲线开始点 */
    startPoint = { x: 0, y: 0 };
    /** 过渡曲线结束点 */
    endPoint = { x: 1, y: 1 };
    /** {键:ID}重映射表 */
    keyRemap = {};
    /** {ID:过渡曲线}映射表 */
    easingMaps = {};
    /** 线性过渡(默认) */
    linear = { get: time => Math.min(time, 1) };
    /** 初始化 */
    initialize() {
        // 生成{键:ID}重映射表
        for (const { id, key } of Object.values(Data.easings)) {
            this.keyRemap[id] = id;
            if (key) {
                this.keyRemap[key] = id;
            }
        }
    }
    /**
     * 获取过渡曲线映射表
     * @param key 过渡曲线ID或键
     * @returns 过渡曲线映射表
     */
    get(key) {
        // 返回缓存映射表
        const id = this.keyRemap[key] ?? '';
        const map = this.easingMaps[id];
        if (map)
            return map;
        // 创建新的映射表
        const easing = Data.easings[id];
        if (easing) {
            return this.easingMaps[id] = new EasingMap(this.startPoint, ...easing.points, this.endPoint);
        }
        // 返回缺省值(线性)
        return this.linear;
    }
};
// 过渡曲线映射表类
class EasingMap extends Float32Array {
    /**
     * 过渡曲线映射表
     * @param points 控制点列表
     */
    constructor(...points) {
        const scale = EasingMap.scale;
        super(scale + 1);
        const length = points.length - 1;
        let pos = -1;
        // 生成过渡曲线，键值对(X，Y)写入映射表
        for (let i = 0; i < length; i += 3) {
            const { x: x0, y: y0 } = points[i];
            const { x: x1, y: y1 } = points[i + 1];
            const { x: x2, y: y2 } = points[i + 2];
            const { x: x3, y: y3 } = points[i + 3];
            for (let n = 0; n <= scale; n++) {
                const t0 = n / scale;
                const t1 = 1 - t0;
                const n0 = t1 ** 3;
                const n1 = 3 * t0 * t1 ** 2;
                const n2 = 3 * t0 ** 2 * t1;
                const n3 = t0 ** 3;
                const x = x0 * n0 + x1 * n1 + x2 * n2 + x3 * n3;
                const i = Math.round(x * scale);
                if (i > pos && i <= scale) {
                    const y = y0 * n0 + y1 * n1 + y2 * n2 + y3 * n3;
                    this[i] = y;
                    if (i > pos + 1) {
                        for (let j = pos + 1; j < i; j++) {
                            this[j] = this[pos] + (this[i] - this[pos]) * (j - pos) / (i - pos);
                        }
                    }
                    pos = i;
                }
            }
        }
        this[scale] = 1;
    }
    /**
     * 获取过渡时间
     * @param time 原生时间
     * @returns 处理后的过渡时间
     */
    get(time) {
        return this[Math.round(Math.clamp(time, 0, 1) * EasingMap.scale)];
    }
    /** 过渡曲线映射表刻度(精度) */
    static scale = 10000;
}
//# sourceMappingURL=time.js.map