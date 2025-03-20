/** ******************************** 输入管理器 ******************************** */
let Input = new class InputManager {
    /** 键盘按键状态 */
    keys = {};
    /** 鼠标按键状态 */
    buttons = new Uint8Array(5);
    /** 当前帧键盘按下列表 */
    keydownList = new CacheList();
    /** 当前帧键盘弹起列表 */
    keyupList = new CacheList();
    /** 当前帧鼠标按下列表 */
    mousedownList = new CacheList();
    /** 当前帧鼠标弹起列表 */
    mouseupList = new CacheList();
    /** 当前帧手柄按下列表 */
    gamepaddownList = new CacheList();
    /** 当前帧手柄弹起列表 */
    gamepadupList = new CacheList();
    /** 输入脚本事件 */
    event = null;
    /** 事件冒泡栈 */
    bubbles;
    /** 输入事件侦听器 */
    listeners = {
        keydown: [],
        keyup: [],
        mousedown: [],
        mousedownLB: [],
        mousedownRB: [],
        mouseup: [],
        mouseupLB: [],
        mouseupRB: [],
        mousemove: [],
        mouseleave: [],
        doubleclick: [],
        wheel: [],
        touchstart: [],
        touchmove: [],
        touchend: [],
        scenemousemove: [],
        gamepadbuttonpress: [],
        gamepadbuttonrelease: [],
        gamepadleftstickchange: [],
        gamepadrightstickchange: [],
    };
    /** 按键黑名单 */
    keydownBlackList = [
        'F1', 'F2', 'F3', 'F4',
        'F5', 'F6', 'F7', 'F8',
        'F9', 'F10', 'TAB',
    ];
    /** 按键白名单(控制键按下时) */
    keydownWhiteListOnCtrl = [
        'KeyA', 'KeyC', 'KeyV', 'KeyX',
        'KeyY', 'KeyZ', 'Digit1', 'Digit2',
        'Digit3', 'Digit4', 'Digit5', 'Digit6',
        'Digit7', 'Digit8', 'Digit9', 'Numpad1',
        'Numpad2', 'Numpad3', 'Numpad4', 'Numpad5',
        'Numpad6', 'Numpad7', 'Numpad8', 'Numpad9',
    ];
    /** 初始化输入管理器 */
    initialize() {
        // 引用事件冒泡栈
        this.bubbles = new EventBubbleStackManager();
        // 侦听事件
        window.on('keydown', this.keydown);
        window.on('keyup', this.keyup);
        window.on('blur', this.blur);
    }
    /** 更新输入状态 */
    update() {
        Mouse.update();
        Controller.update();
    }
    /**
     * 判断是否刚按下键盘键
     * @param keyName 键名
     * @returns 是否刚按下
     */
    getKeyDown(keyName) {
        return this.keydownList.contains(keyName);
    }
    /**
     * 判断是否刚弹起键盘键
     * @param keyName 键名
     * @returns 是否刚弹起
     */
    getKeyUp(keyName) {
        return this.keyupList.contains(keyName);
    }
    /**
     * 判断是否已经按下键盘键
     * @param keyName 键名
     * @returns 是否已经按下
     */
    getKey(keyName) {
        return this.keys[keyName] === 1;
    }
    /**
     * 判断是否刚按下鼠标键
     * @param button 键码
     * @returns 是否刚按下
     */
    getMouseButtonDown(button) {
        return this.mousedownList.contains(button);
    }
    /**
     * 判断是否刚弹起鼠标键
     * @param button 键码
     * @returns 是否刚弹起
     */
    getMouseButtonUp(button) {
        return this.mouseupList.contains(button);
    }
    /**
     * 判断是否已经按下鼠标键
     * @param button 键码
     * @returns 是否已经按下
     */
    getMouseButton(button) {
        return this.buttons[button] === 1;
    }
    /**
     * 判断是否刚按下手柄键
     * @param button 键码
     * @returns 是否刚按下
     */
    getGamepadButtonDown(button) {
        return this.gamepaddownList.contains(button);
    }
    /**
     * 判断是否刚弹起手柄键
     * @param button 键码
     * @returns 是否刚弹起
     */
    getGamepadButtonUp(button) {
        return this.gamepadupList.contains(button);
    }
    /**
     * 判断是否已经按下手柄键
     * @param button 键码
     * @returns 是否已经按下
     */
    getGamepadButton(button) {
        return Controller.buttons[button];
    }
    /**
     * 添加输入事件侦听器
     * @param type 输入事件类型
     * @param listener 回调函数
     * @param priority 是否将该事件设为最高优先级
     */
    on(type, listener, priority = false) {
        const list = this.listeners[type];
        if (!list.includes(listener)) {
            if (priority) {
                list.unshift(listener);
            }
            else {
                list.push(listener);
            }
        }
    }
    /**
     * 移除输入事件侦听器
     * @param type 输入事件类型
     * @param listener 回调函数
     */
    off(type, listener) {
        const group = this.listeners[type];
        const index = group.indexOf(listener);
        if (index !== -1) {
            const replacer = () => { };
            group[index] = replacer;
            Callback.push(() => {
                group.remove(replacer);
            });
        }
    }
    /**
     * 发送输入事件
     * @param type 输入事件类型
     * @param params 传递参数
     */
    emit(type, event) {
        this.event = event;
        this.bubbles.push(true);
        for (const listener of this.listeners[type]) {
            if (this.bubbles.get()) {
                listener(event);
                continue;
            }
            break;
        }
        this.bubbles.pop();
        this.event = null;
    }
    /**
     * 获取触摸点
     * @param touchId 触摸点ID
     * @returns 触摸点
     */
    getTouch(touchId) {
        const event = this.event;
        if (event instanceof ScriptTouchEvent) {
            return event.getTouch(touchId);
        }
    }
    /**
     * 按键过滤器
     * @param event 键盘事件
     */
    keydownFilter(event) {
        // 如果是本地运行，返回
        if (Stats.isOnClient) {
            return;
        }
        // 阻止默认按键行为(Web模式)
        const { code } = event;
        if (event.cmdOrCtrlKey) {
            if (!this.keydownWhiteListOnCtrl.includes(code)) {
                event.preventDefault();
            }
        }
        else if (event.altKey) {
            event.preventDefault();
        }
        else if (this.keydownBlackList.includes(code)) {
            event.preventDefault();
        }
    }
    /**
     * 键盘按下事件
     * @param event 键盘事件
     */
    keydown(event) {
        Input.keydownFilter(event);
        // 当文本输入框获得焦点时，返回
        if (document.activeElement instanceof HTMLInputElement) {
            return;
        }
        // 触发游戏事件
        const { keys } = Input;
        const { code } = event;
        if (keys[code] !== 1) {
            keys[code] = 1;
            Input.keydownList.add(code);
            Input.emit('keydown', new ScriptKeyboardEvent(event));
        }
        // 功能快捷键
        switch (event.code) {
            case 'F5':
                if (Stats.debug) {
                    location.reload();
                }
                break;
            case 'F10':
                Game.switchGameInfoDisplay();
                break;
        }
    }
    /**
     * 键盘弹起事件
     * @param event 键盘事件
     */
    keyup(event) {
        // 触发游戏事件
        const { keys } = Input;
        const { code } = event;
        if (keys[code] === 1) {
            keys[code] = 0;
            Input.keyupList.add(code);
            Input.emit('keyup', new ScriptKeyboardEvent(event));
        }
    }
    /**
     * 失去焦点事件
     * @param event 焦点事件
     */
    blur(event) {
        // 弹起所有按下的键盘按键
        for (const [keycode, state] of Object.entries(Input.keys)) {
            if (state === 1) {
                Input.simulateKey('keyup', keycode);
            }
        }
        // 弹起所有按下的鼠标按键
        for (let i = 0; i < Input.buttons.length; i++) {
            if (Input.buttons[i] === 1) {
                Input.simulateButton('pointerup', i);
            }
        }
    }
    /**
     * 模拟键盘按键
     * @param type 键盘事件类型
     * @param keycode 键码
     */
    simulateKey(type, keycode) {
        const event = Input.event;
        window.dispatchEvent(new KeyboardEvent(type, { code: keycode }));
        Input.event = event;
    }
    /**
     * 模拟鼠标按键
     * @param type 指针事件类型
     * @param button 键码
     */
    simulateButton(type, button) {
        const event = Input.event;
        window.dispatchEvent(new PointerEvent(type, { button: button }));
        Input.event = event;
    }
    /** 清除临时输入状态 */
    clearTempInputStatus() {
        Input.keydownList.clear();
        Input.keyupList.clear();
        Input.mousedownList.clear();
        Input.mouseupList.clear();
        Input.gamepaddownList.clear();
        Input.gamepadupList.clear();
    }
};
/** ******************************** 鼠标管理器 ******************************** */
let Mouse = new class MouseManager {
    /** 画布是否发生旋转 */
    rotated = false;
    /** 鼠标是否已进入 */
    entered = true;
    /** 画布的左边位置 */
    left = 0;
    /** 画布的顶部位置 */
    top = 0;
    /** 画布的右边位置 */
    right = 0;
    /** 画布的水平缩放率 */
    ratioX = 0;
    /** 画布的垂直缩放率 */
    ratioY = 0;
    /** 当前鼠标的屏幕X */
    screenX = -1;
    /** 当前鼠标的屏幕Y */
    screenY = -1;
    /** 当前鼠标的场景X */
    sceneX = -1;
    /** 当前鼠标的场景Y */
    sceneY = -1;
    /** 共享坐标点 */
    sharedPoint = { x: 0, y: 0 };
    /** 指针事件缓存 */
    eventCache;
    /** 双击事件缓存 */
    doubleclickCache = null;
    /** 初始化鼠标管理器 */
    initialize() {
        this.eventCache = new ScriptMouseEvent(new PointerEvent('pointermove'));
        // 调整位置
        this.resize();
        // 侦听事件
        window.on('resize', this.resize);
        window.on('touchstart', this.touchstart, { passive: false });
        window.on('touchmove', this.touchmove);
        window.on('touchend', this.touchend);
        window.on('mousedown', this.mousedown);
        window.on('mouseup', this.mouseup);
        window.on('pointerdown', this.pointerdown);
        window.on('pointerup', this.pointerup);
        window.on('pointermove', this.pointermove);
        window.on('pointerenter', this.pointerenter);
        window.on('pointerleave', this.pointerleave);
        window.on('mousedown', this.doubleclick);
        window.on('wheel', this.wheel);
    }
    /** 更新鼠标的场景坐标 */
    update() {
        Mouse.calculateSceneCoords();
    }
    /**
     * 触摸开始事件
     * @param event 触摸事件
     */
    touchstart(event) {
        // 阻止移动设备浏览器长按震动(只能在这个事件中阻止)
        event.preventDefault();
        Input.emit('touchstart', new ScriptTouchEvent(event));
    }
    /**
     * 触摸移动事件
     * @param event 触摸事件
     */
    touchmove(event) {
        Input.emit('touchmove', new ScriptTouchEvent(event));
    }
    /**
     * 触摸结束事件
     * @param event 触摸事件
     */
    touchend(event) {
        Input.emit('touchend', new ScriptTouchEvent(event));
    }
    /**
     * 鼠标按下事件
     * @param event 鼠标事件
     */
    mousedown(event) {
        if (Input.buttons[event.button] === 0) {
            Input.buttons[event.button] = 1;
            Input.mousedownList.add(event.button);
            const scriptEvent = new ScriptMouseEvent(event);
            switch (event.button) {
                case 0:
                    Input.emit('mousedownLB', scriptEvent);
                    break;
                case 2:
                    Input.emit('mousedownRB', scriptEvent);
                    break;
            }
            Input.emit('mousedown', scriptEvent);
        }
    }
    /**
     * 鼠标弹起事件
     * @param event 鼠标事件
     */
    mouseup(event) {
        if (Input.buttons[event.button] === 1) {
            Input.buttons[event.button] = 0;
            Input.mouseupList.add(event.button);
            const scriptEvent = new ScriptMouseEvent(event);
            switch (event.button) {
                case 0:
                    Input.emit('mouseupLB', scriptEvent);
                    break;
                case 2:
                    Input.emit('mouseupRB', scriptEvent);
                    break;
                // 阻止Chrome浏览器：
                // 前进/后退键弹起页面导航行为
                case 3:
                case 4:
                    event.preventDefault();
                    break;
            }
            Input.emit('mouseup', scriptEvent);
        }
    }
    /**
     * 指针按下事件(单指触控开始)
     * @param event 指针事件
     */
    pointerdown(event) {
        if (event.pointerType !== 'mouse' && event.isPrimary && Input.buttons[0] === 0) {
            // 模拟鼠标按下行为:
            // 1.鼠标进入游戏窗口
            // 2.鼠标移动到目标位置
            // 3.鼠标[左键]按下
            Mouse.pointerenter(event);
            Mouse.pointermove(event);
            Input.buttons[0] = 1;
            Input.mousedownList.add(0);
            const scriptEvent = new ScriptMouseEvent(event);
            Input.emit('mousedownLB', scriptEvent);
            Input.emit('mousedown', scriptEvent);
        }
    }
    /**
     * 指针弹起事件(单指触控结束)
     * @param event 指针事件
     */
    pointerup(event) {
        if (event.pointerType !== 'mouse' && event.isPrimary && Input.buttons[0] === 1) {
            // 模拟鼠标弹起行为:
            // 1.鼠标[左键]弹起
            // 2.鼠标离开游戏窗口
            Input.buttons[0] = 0;
            Input.mouseupList.add(0);
            const scriptEvent = new ScriptMouseEvent(event);
            Input.emit('mouseupLB', scriptEvent);
            Input.emit('mouseup', scriptEvent);
            Mouse.pointerleave(event);
        }
    }
    /**
     * 指针移动事件
     * @param event 指针事件
     */
    pointermove(event) {
        // 在非100%缩放率的设备上，PointerEvent更好
        // PointerEvent.clientX/clientY精确到小数
        // MouseEvent.clientX/clientY精确到整数
        const scriptEvent = new ScriptMouseEvent(event);
        Mouse.calculateCoords(scriptEvent);
        Input.emit('mousemove', scriptEvent);
    }
    /**
     * 指针进入事件
     * @param event 指针事件
     */
    pointerenter(event) {
        if (!Mouse.entered) {
            Mouse.entered = true;
        }
    }
    /**
     * 指针离开事件
     * @param event 指针事件
     */
    pointerleave(event) {
        if (Mouse.entered) {
            Mouse.entered = false;
            Input.emit('mouseleave', new ScriptMouseEvent(event));
        }
    }
    /**
     * 鼠标双击事件
     * @param event 鼠标事件
     */
    doubleclick(event) {
        if (!event.cmdOrCtrlKey &&
            !event.altKey &&
            !event.shiftKey) {
            switch (event.button) {
                case 0: {
                    // 用鼠标按下事件来模拟鼠标双击事件
                    // 原生的鼠标双击事件在第二次弹起时触发
                    // 而模拟的在第二次按下时触发，手感更好
                    // 要求：按键间隔<500ms，抖动偏移<4px
                    if (Mouse.doubleclickCache !== null &&
                        event.timeStamp - Mouse.doubleclickCache.timeStamp < 500 &&
                        Math.abs(event.clientX - Mouse.doubleclickCache.clientX) < 4 &&
                        Math.abs(event.clientY - Mouse.doubleclickCache.clientY) < 4) {
                        Input.emit('doubleclick', new ScriptMouseEvent(event));
                        Mouse.doubleclickCache = null;
                    }
                    else {
                        Mouse.doubleclickCache = event;
                    }
                    break;
                }
                default:
                    Mouse.doubleclickCache = null;
                    break;
            }
        }
    }
    /**
     * 鼠标滚轮事件
     * @param event 滚轮事件
     */
    wheel(event) {
        Input.emit('wheel', new ScriptWheelEvent(event));
    }
    /** 重新调整位置 */
    resize() {
        const container = GL.container;
        const canvas = GL.canvas;
        const rect = container.getBoundingClientRect();
        Mouse.rotated = container.style.transform === 'rotate(90deg)';
        Mouse.left = rect.left;
        Mouse.top = rect.top;
        Mouse.right = rect.right;
        switch (Mouse.rotated) {
            case false:
                // 屏幕未旋转的情况
                Mouse.ratioX = canvas.width / rect.width;
                Mouse.ratioY = canvas.height / rect.height;
                break;
            case true:
                // 屏幕旋转90度的情况
                Mouse.ratioX = canvas.width / rect.height;
                Mouse.ratioY = canvas.height / rect.width;
                break;
        }
        // 重新计算坐标
        Mouse.calculateCoords(Mouse.eventCache);
    }
    /**
     * 计算坐标
     * @param event 指针事件
     */
    calculateCoords(event) {
        const { clientX, clientY } = event.browserMouseEvent;
        const { x, y } = this.convertClientToScreenCoords(clientX, clientY);
        this.screenX = x;
        this.screenY = y;
        this.eventCache = event;
        this.calculateSceneCoords();
    }
    /** 计算场景坐标 */
    calculateSceneCoords() {
        const { x, y } = this.convertScreenToSceneCoords(this.screenX, this.screenY);
        if (this.sceneX !== x || this.sceneY !== y) {
            this.sceneX = x;
            this.sceneY = y;
            Input.emit('scenemousemove', this.eventCache);
        }
    }
    /**
     * 转换客户端到屏幕坐标
     * @param clientX 客户端X
     * @param clientY 客户端Y
     * @returns 屏幕坐标
     */
    convertClientToScreenCoords(clientX, clientY) {
        const point = this.sharedPoint;
        switch (this.rotated) {
            case false:
                // 屏幕未旋转的情况
                point.x = Math.round((clientX - this.left) * this.ratioX - 0.0001);
                point.y = Math.round((clientY - this.top) * this.ratioY - 0.0001);
                break;
            case true:
                // 屏幕旋转90度的情况
                point.x = Math.round((clientY - this.top) * this.ratioX - 0.0001);
                point.y = Math.round((this.right - clientX) * this.ratioY - 0.0001);
                break;
        }
        return point;
    }
    /**
     * 转换屏幕到场景坐标
     * @param screenX 屏幕X
     * @param screenY 屏幕Y
     * @returns 场景坐标
     */
    convertScreenToSceneCoords(screenX, screenY) {
        const point = this.sharedPoint;
        const scene = Scene.binding;
        if (scene === null) {
            point.x = 0;
            point.y = 0;
            return point;
        }
        const x = Math.round(Camera.scrollLeft) + screenX / Camera.zoom;
        const y = Math.round(Camera.scrollTop) + screenY / Camera.zoom;
        point.x = x / scene.tileWidth;
        point.y = y / scene.tileHeight;
        return point;
    }
};
/** ******************************** 游戏手柄管理器 ******************************** */
let Controller = new class ControllerManager {
    /** 正在触发的摇杆角度 */
    stickAngle = -1;
    /** 正在触发的按钮码(-1:未按下任何按键) */
    buttonCode = -1;
    /** 正在触发的按钮名称 */
    buttonName = '';
    /** 按钮状态数组(true:已按下/false:已弹起) */
    buttons = new Array(16).fill(false);
    /** {按钮码:按钮名称}映射表 */
    buttonNames = {
        0: 'A',
        1: 'B',
        2: 'X',
        3: 'Y',
        4: 'LB',
        5: 'RB',
        6: 'LT',
        7: 'RT',
        8: 'View',
        9: 'Menu',
        10: 'LS',
        11: 'RS',
        12: 'Up',
        13: 'Down',
        14: 'Left',
        15: 'Right',
    };
    /** {按钮名称:按下状态}映射表 */
    states = {
        A: false,
        B: false,
        X: false,
        Y: false,
        LB: false,
        RB: false,
        LT: false,
        RT: false,
        View: false,
        Menu: false,
        LS: false,
        RS: false,
        Up: false,
        Down: false,
        Left: false,
        Right: false,
        LeftStickAngle: -1,
        RightStickAngle: -1,
    };
    /** 初始化 */
    initialize() {
        // 禁用更新函数
        this.update = Function.empty;
        // 侦听事件
        window.on('gamepadconnected', this.connect);
        window.on('gamepaddisconnected', this.disconnect);
    }
    /** 重置 */
    reset() {
        this.buttons.fill(false);
        const states = this.states;
        for (const key of Object.keys(states)) {
            switch (typeof states[key]) {
                case 'boolean':
                    states[key] = false;
                    continue;
                case 'number':
                    states[key] = -1;
                    continue;
            }
        }
    }
    /** 更新按键 */
    update() {
        const pads = navigator.getGamepads();
        const pad = pads[0] ?? pads[1] ?? pads[2] ?? pads[3] ?? null;
        if (!pad)
            return;
        const axes = pad.axes;
        const pButtons = pad.buttons;
        const cButtons = this.buttons;
        const buttonNames = this.buttonNames;
        const states = this.states;
        // 更新按钮
        const length = Math.min(cButtons.length, pButtons.length);
        for (let i = 0; i < length; i++) {
            const button = pButtons[i];
            if (cButtons[i] !== button.pressed) {
                cButtons[i] = button.pressed;
                const code = i;
                const name = buttonNames[code];
                states[name] = button.pressed;
                this.buttonCode = code;
                this.buttonName = name;
                if (button.pressed) {
                    Input.gamepaddownList.add(code);
                    Input.emit('gamepadbuttonpress', new ScriptGamepadEvent(pad));
                }
                else {
                    Input.gamepadupList.add(code);
                    Input.emit('gamepadbuttonrelease', new ScriptGamepadEvent(pad));
                }
            }
        }
        // 重置按钮
        this.buttonCode = -1;
        this.buttonName = '';
        // 更新左摇杆
        let leftStickChanged = false;
        if (axes[0] ** 2 + axes[1] ** 2 > 0.4) {
            const radians = Math.atan2(axes[1], axes[0]);
            const degrees = Math.modDegrees(Math.degrees(radians));
            states.LeftStickAngle = degrees;
            leftStickChanged = true;
        }
        else if (states.LeftStickAngle !== -1) {
            states.LeftStickAngle = -1;
            leftStickChanged = true;
        }
        if (leftStickChanged) {
            this.stickAngle = states.LeftStickAngle;
            Input.emit('gamepadleftstickchange', new ScriptGamepadEvent(pad));
            this.stickAngle = -1;
        }
        // 更新右摇杆
        let rightStickChanged = false;
        if (axes[2] ** 2 + axes[3] ** 2 > 0.4) {
            const radians = Math.atan2(axes[3], axes[2]);
            const degrees = Math.modDegrees(Math.degrees(radians));
            states.RightStickAngle = degrees;
            rightStickChanged = true;
        }
        else if (states.RightStickAngle !== -1) {
            states.RightStickAngle = -1;
            rightStickChanged = true;
        }
        if (rightStickChanged) {
            this.stickAngle = states.RightStickAngle;
            Input.emit('gamepadrightstickchange', new ScriptGamepadEvent(pad));
            this.stickAngle = -1;
        }
    }
    /**
     * 手柄连接事件
     * @param event 手柄事件
     */
    connect(event) {
        const pads = navigator.getGamepads();
        for (const pad of pads) {
            if (pad) {
                // @ts-ignore
                delete Controller.update;
                break;
            }
        }
    }
    /**
     * 手柄失去连接事件
     * @param event 手柄事件
     */
    disconnect(event) {
        const pads = navigator.getGamepads();
        for (const pad of pads) {
            if (pad) {
                return;
            }
        }
        Controller.update = Function.empty;
        Controller.reset();
    }
};
/** ******************************** 虚拟轴 ******************************** */
let VirtualAxis = new class VirtualAxis {
    /** 水平轴的距离[-1, 1] */
    x = 0;
    /** 垂直轴的距离[-1, 1] */
    y = 0;
    /** 角度[0, 360)(-1:未按下任何按键) */
    angle = -1;
    /** 弧度[0, 2π)(-1:未按下任何按键) */
    radians = -1;
    /** 按键状态 */
    states = {
        up: false,
        down: false,
        left: false,
        right: false,
    };
    /** 初始化 */
    initialize() {
        window.on('keydown', this.keydown.bind(this), { capture: true });
        window.on('keyup', this.keyup.bind(this), { capture: true });
    }
    /** 更新xy轴 */
    update() {
        let x = 0;
        let y = 0;
        if (this.states.up) {
            y -= 1;
        }
        if (this.states.down) {
            y += 1;
        }
        if (this.states.left) {
            x -= 1;
        }
        if (this.states.right) {
            x += 1;
        }
        if (x === 0 && y === 0) {
            this.radians = -1;
            this.angle = -1;
        }
        else {
            this.radians = Math.atan2(y, x);
            this.angle = Math.modDegrees(Math.degrees(this.radians));
            if (x !== 0 && y !== 0) {
                x /= Math.SQRT2;
                y /= Math.SQRT2;
            }
        }
        this.x = x;
        this.y = y;
    }
    /**
     * 键盘按下事件
     * @param event 键盘事件
     */
    keydown(event) {
        const { virtualAxis } = Data.config;
        switch (event.code) {
            case virtualAxis.up:
                this.states.up = true;
                this.update();
                break;
            case virtualAxis.down:
                this.states.down = true;
                this.update();
                break;
            case virtualAxis.left:
                this.states.left = true;
                this.update();
                break;
            case virtualAxis.right:
                this.states.right = true;
                this.update();
                break;
        }
    }
    /**
     * 键盘弹起事件
     * @param event 键盘事件
     */
    keyup(event) {
        const { virtualAxis } = Data.config;
        switch (event.code) {
            case virtualAxis.up:
                this.states.up = false;
                this.update();
                break;
            case virtualAxis.down:
                this.states.down = false;
                this.update();
                break;
            case virtualAxis.left:
                this.states.left = false;
                this.update();
                break;
            case virtualAxis.right:
                this.states.right = false;
                this.update();
                break;
        }
    }
};
/** ******************************** 事件冒泡堆栈管理器 ******************************** */
class EventBubbleStackManager {
    /** 栈索引 */
    index = 0;
    /** 事件冒泡状态栈 */
    stack = [false];
    /**
     * 获取事件冒泡状态
     * @returns false=停止传递事件
     */
    get() {
        return this.stack[this.index];
    }
    /** 开始事件冒泡 */
    start() {
        this.stack[this.index] = true;
    }
    /** 停止事件冒泡 */
    stop() {
        this.stack[this.index] = false;
    }
    /**
     * 推入事件冒泡状态
     * @param bubble 冒泡状态
     */
    push(bubble) {
        this.stack[++this.index] = bubble;
    }
    /** 弹出事件冒泡状态 */
    pop() {
        this.index--;
    }
}
//# sourceMappingURL=input.js.map