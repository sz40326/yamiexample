// ******************************** 舞台管理器 ********************************
let Stage = new class StageManager {
    /** 分辨率宽度 */
    width = 0;
    /** 分辨率高度 */
    height = 0;
    /** 初始化舞台 */
    async initialize() {
        // 设置网页标题
        const title = document.createElement('title');
        title.textContent = Data.config.window.title;
        document.head.appendChild(title);
        // 设置body样式
        document.body.style.margin = '0';
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
        // 设置初始分辨率
        this.width = Data.globalData.canvasWidth;
        this.height = Data.globalData.canvasHeight;
        // 调整窗口大小
        this.resizeWindow();
        // 调整大小
        this.resize();
        // 侦听事件
        window.on('resize', this.resize);
    }
    /**
     * 调整窗口大小
     */
    resizeWindow() {
        // 本地运行游戏且非100%缩放时，自动调整设备像素比率
        if (Stats.shell === 'electron' && window.devicePixelRatio !== 1) {
            // MacOS不像Windows一样锁定窗口最大化
            if (!Stats.isMacOS() || Data.config.window.display === 'windowed') {
                require('electron').ipcRenderer.send('set-device-pixel-ratio', window.devicePixelRatio);
            }
        }
    }
    /**
     * 设置分辨率
     * @param width 分辨率宽度
     * @param height 分辨率高度
     * @param sceneScale 场景缩放系数
     * @param uiScale 界面缩放系数
     */
    setResolution(width, height, sceneScale, uiScale) {
        this.width = width;
        this.height = height;
        this.resize();
        Mouse.resize();
        Scene.setScale(sceneScale);
        UI.setScale(uiScale);
    }
    /**
     * 缩放画布
     * @param width 画布宽度
     * @param height 画布高度
     */
    scaleCanvas(width, height) {
        const canvasWidth = width;
        const canvasHeight = height;
        const parentWidth = window.innerWidth;
        const parentHeight = window.innerHeight;
        const { container } = GL;
        // 禁止旋转容器元素
        container.style.transform = '';
        if (canvasWidth / canvasHeight >= parentWidth / parentHeight) {
            // 如果画布宽高比大于容器宽高比，则上下留黑边
            const scaledHeight = Math.round(canvasHeight / canvasWidth * parentWidth);
            container.style.left = '0';
            container.style.top = `${parentHeight - scaledHeight >> 1}px`;
            container.style.width = `${parentWidth}px`;
            container.style.height = `${scaledHeight}px`;
        }
        else {
            // 如果画布宽高比小于容器宽高比，则左右留黑边
            const scaledWidth = Math.round(canvasWidth / canvasHeight * parentHeight);
            container.style.left = `${parentWidth - scaledWidth >> 1}px`;
            container.style.top = '0';
            container.style.width = `${scaledWidth}px`;
            container.style.height = `${parentHeight}px`;
        }
    }
    /**
     * 旋转并缩放画布
     * @param width 画布宽度
     * @param height 画布高度
     */
    rotateAndScaleCanvas(width, height) {
        const canvasWidth = width;
        const canvasHeight = height;
        const parentWidth = window.innerHeight;
        const parentHeight = window.innerWidth;
        const { container } = GL;
        // 以左上角为锚点，旋转容器元素90度
        container.style.transformOrigin = 'left top';
        container.style.transform = 'rotate(90deg)';
        if (canvasWidth / canvasHeight >= parentWidth / parentHeight) {
            // 如果画布宽高比大于容器宽高比，则上下留黑边
            const scaledHeight = Math.round(canvasHeight / canvasWidth * parentWidth);
            container.style.left = `${parentHeight + scaledHeight >> 1}px`;
            container.style.top = '0';
            container.style.width = `${parentWidth}px`;
            container.style.height = `${scaledHeight}px`;
        }
        else {
            // 如果画布宽高比小于容器宽高比，则左右留黑边
            const scaledWidth = Math.round(canvasWidth / canvasHeight * parentHeight);
            container.style.left = `${parentHeight}px`;
            container.style.top = `${parentWidth - scaledWidth >> 1}px`;
            container.style.width = `${scaledWidth}px`;
            container.style.height = `${parentHeight}px`;
        }
    }
    /** 重新调整大小事件 */
    resize() {
        const { width, height } = Stage;
        GL.resize(width, height);
        switch (Stats.deviceType) {
            case 'pc':
                // 个人电脑模式
                Stage.scaleCanvas(width, height);
                break;
            case 'mobile':
                // 移动设备模式：如果最小分辨率宽高比和窗口宽高比同时>=1或同时<1，则不用旋转
                if ((width >= height) === (window.innerWidth >= window.innerHeight)) {
                    // 不旋转
                    Stage.scaleCanvas(width, height);
                }
                else {
                    // 旋转90度
                    Stage.rotateAndScaleCanvas(width, height);
                }
                break;
        }
    }
};
//# sourceMappingURL=stage.js.map