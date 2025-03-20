/** ******************************** 场景摄像机 ******************************** */
let Camera = new class SceneCamera {
    /** 摄像机跟随的目标角色 */
    target = null;
    /** 摄像机更新器模块列表 */
    updaters = new UpdaterList();
    /** 摄像机水平位置 */
    x = 0;
    /** 摄像机垂直位置 */
    y = 0;
    /** 摄像机缩放率 */
    zoom = 1;
    /** 摄像机原生缩放率 */
    rawZoom = 1;
    /** 摄像机矩形区域宽度 */
    width = 0;
    /** 摄像机矩形区域高度 */
    height = 0;
    /** 场景边距 */
    padding = 0;
    /** 图块扩张区域 */
    tileArea;
    /** 动画扩张区域 */
    animationArea;
    /** 光源扩张区域 */
    lightArea;
    /** 限制滚动位置(左) */
    clampedLeft = Infinity;
    /** 限制滚动位置(上) */
    clampedTop = Infinity;
    /** 限制滚动位置(右) */
    clampedRight = Infinity;
    /** 限制滚动位置(下) */
    clampedBottom = Infinity;
    /** 滚动位置(左) */
    scrollLeft = 0;
    /** 滚动位置(上) */
    scrollTop = 0;
    /** 滚动位置(右) */
    scrollRight = 0;
    /** 滚动位置(下) */
    scrollBottom = 0;
    /** 滚动位置(左)(单位:图块) */
    scrollLeftT = 0;
    /** 滚动位置(上)(单位:图块) */
    scrollTopT = 0;
    /** 滚动位置(右)(单位:图块) */
    scrollRightT = 0;
    /** 滚动位置(下)(单位:图块) */
    scrollBottomT = 0;
    /** 滚动位置(中心X) */
    scrollCenterX = 0;
    /** 滚动位置(中心Y) */
    scrollCenterY = 0;
    /** 图块渲染区域(左) */
    tileLeft = 0;
    /** 图块渲染区域(上) */
    tileTop = 0;
    /** 图块渲染区域(右) */
    tileRight = 0;
    /** 图块渲染区域(下) */
    tileBottom = 0;
    /** 动画渲染区域(左) */
    animationLeft = 0;
    /** 动画渲染区域(上) */
    animationTop = 0;
    /** 动画渲染区域(右) */
    animationRight = 0;
    /** 动画渲染区域(下) */
    animationBottom = 0;
    /** 动画渲染区域(左)(单位:图块) */
    animationLeftT = 0;
    /** 动画渲染区域(上)(单位:图块) */
    animationTopT = 0;
    /** 动画渲染区域(右)(单位:图块) */
    animationRightT = 0;
    /** 动画渲染区域(下)(单位:图块) */
    animationBottomT = 0;
    /** 光源渲染区域(左) */
    lightLeft = 0;
    /** 光源渲染区域(上) */
    lightTop = 0;
    /** 光源渲染区域(右) */
    lightRight = 0;
    /** 光源渲染区域(下) */
    lightBottom = 0;
    /** 镜头晃动偏移X */
    shakeX = 0;
    /** 镜头晃动偏移Y */
    shakeY = 0;
    /** 初始化摄像机 */
    initialize() {
        this.padding = Data.config.scene.padding;
        this.tileArea = Data.config.tileArea;
        this.animationArea = Data.config.animationArea;
        this.lightArea = Data.config.lightArea;
    }
    /** 重置摄像机 */
    reset() {
        this.target = null;
        this.x = 0;
        this.y = 0;
        this.rawZoom = 1;
        this.updateZoom();
        this.updaters.delete('move');
        this.updaters.delete('zoom');
    }
    /**
     * 移动摄像机到指定位置
     * @param x 场景X
     * @param y 场景Y
     * @param easingId 过渡曲线ID
     * @param duration 持续时间(毫秒)
     */
    moveTo(x, y, easingId = '', duration = 0) {
        this.unfollow();
        const { updaters } = this;
        if (duration > 0) {
            let elapsed = 0;
            const sx = this.x;
            const sy = this.y;
            const easing = Easing.get(easingId);
            // 创建更新器
            updaters.set('move', {
                update: deltaTime => {
                    elapsed += deltaTime;
                    const time = easing.get(elapsed / duration);
                    this.x = sx * (1 - time) + x * time;
                    this.y = sy * (1 - time) + y * time;
                    if (elapsed >= duration) {
                        updaters.deleteDelay('move');
                    }
                }
            });
        }
        else {
            // 立即移动摄像机
            updaters.deleteDelay('move');
            this.x = x;
            this.y = y;
        }
    }
    /**
     * 摄像机跟随目标角色
     * @param target 目标角色
     * @param easingId 过渡曲线ID
     * @param duration 持续时间(毫秒)
     */
    follow(target, easingId = '', duration = 0) {
        this.target = target;
        const { updaters } = this;
        if (duration > 0) {
            let elapsed = 0;
            const sx = this.x;
            const sy = this.y;
            const easing = Easing.get(easingId);
            // 创建更新器
            updaters.set('move', {
                update: deltaTime => {
                    elapsed += deltaTime;
                    const time = easing.get(elapsed / duration);
                    this.x = sx * (1 - time) + target.x * time;
                    this.y = sy * (1 - time) + target.y * time;
                    if (elapsed >= duration) {
                        updaters.set('move', this.createFollowingUpdater());
                    }
                }
            });
        }
        else {
            // 立即移动摄像机
            updaters.set('move', this.createFollowingUpdater());
            this.x = target.x;
            this.y = target.y;
        }
    }
    /** 解除摄像机跟随目标 */
    unfollow() {
        this.target = null;
    }
    /**
     * 设置限制范围
     */
    clamp(left, top, right, bottom) {
        this.clampedLeft = Math.min(left, right);
        this.clampedTop = Math.min(top, bottom);
        this.clampedRight = Math.max(left, right);
        this.clampedBottom = Math.max(top, bottom);
    }
    /**
     * 接触限制范围
     */
    unclamp() {
        this.clampedLeft = Infinity;
        this.clampedTop = Infinity;
        this.clampedRight = Infinity;
        this.clampedBottom = Infinity;
    }
    /**
     * 设置摄像机缩放系数
     * @param zoom 缩放系数[1-8]
     * @param easingId 过渡曲线ID
     * @param duration 持续时间(毫秒)
     */
    setZoomFactor(zoom, easingId = '', duration = 0) {
        const { updaters } = this;
        if (duration > 0) {
            let elapsed = 0;
            const start = this.rawZoom;
            const easing = Easing.get(easingId);
            // 创建zoom更新器
            updaters.set('zoom', {
                update: deltaTime => {
                    elapsed += deltaTime;
                    const time = easing.get(elapsed / duration);
                    this.rawZoom = start * (1 - time) + zoom * time;
                    this.updateZoom();
                    if (elapsed >= duration) {
                        updaters.deleteDelay('zoom');
                    }
                }
            });
        }
        else {
            // 立即设置摄像机缩放系数
            updaters.deleteDelay('zoom');
            this.rawZoom = zoom;
            this.updateZoom();
        }
    }
    /** 更新缩放率 */
    updateZoom() {
        this.zoom = this.rawZoom * Scene.scale;
    }
    /**
     * 更新摄像机的位置以及相关参数
     * @param deltaTime 增量时间(毫秒)
     */
    update(deltaTime) {
        // 更新模块
        this.updaters.update(deltaTime);
        // 计算摄像机位置
        const scene = Scene.binding;
        const zoom = this.zoom;
        const tileWidth = scene.tileWidth;
        const tileHeight = scene.tileHeight;
        const cameraWidth = GL.width / zoom;
        const cameraHeight = GL.height / zoom;
        const center = scene.convert(this);
        let clampedLeft;
        let clampedTop;
        let clampedRight;
        let clampedBottom;
        let scrollLeft;
        let scrollTop;
        if (this.clampedLeft !== Infinity) {
            clampedLeft = this.clampedLeft * tileWidth;
            clampedTop = this.clampedTop * tileHeight;
            clampedRight = this.clampedRight * tileWidth;
            clampedBottom = this.clampedBottom * tileHeight;
        }
        else {
            const padding = this.padding;
            const innerWidth = scene.width * tileWidth;
            const innerHeight = scene.height * tileHeight;
            clampedLeft = -padding;
            clampedRight = innerWidth + padding;
            clampedTop = -padding;
            clampedBottom = innerHeight + padding;
        }
        const maxClampedLeft = clampedRight - cameraWidth;
        const maxClampedTop = clampedBottom - cameraHeight;
        if (clampedLeft < maxClampedLeft) {
            scrollLeft = Math.clamp(center.x - cameraWidth / 2, clampedLeft, maxClampedLeft);
        }
        else {
            scrollLeft = (clampedLeft + clampedRight - cameraWidth) / 2;
        }
        if (clampedTop < maxClampedTop) {
            scrollTop = Math.clamp(center.y - cameraHeight / 2, clampedTop, maxClampedTop);
        }
        else {
            scrollTop = (clampedTop + clampedBottom - cameraHeight) / 2;
        }
        scrollLeft += this.shakeX;
        scrollTop += this.shakeY;
        const tile = this.tileArea;
        const animation = this.animationArea;
        const light = this.lightArea;
        const scrollRight = scrollLeft + cameraWidth;
        const scrollBottom = scrollTop + cameraHeight;
        this.width = cameraWidth;
        this.height = cameraHeight;
        this.scrollLeft = scrollLeft;
        this.scrollTop = scrollTop;
        this.scrollRight = scrollRight;
        this.scrollBottom = scrollBottom;
        this.scrollCenterX = (scrollLeft + scrollRight) / 2;
        this.scrollCenterY = (scrollTop + scrollBottom) / 2;
        this.scrollLeftT = scrollLeft / tileWidth;
        this.scrollTopT = scrollTop / tileHeight;
        this.scrollRightT = scrollRight / tileWidth;
        this.scrollBottomT = scrollBottom / tileHeight;
        this.tileLeft = scrollLeft - tile.expansionLeft;
        this.tileTop = scrollTop - tile.expansionTop;
        this.tileRight = scrollRight + tile.expansionRight;
        this.tileBottom = scrollBottom + tile.expansionBottom;
        this.animationLeft = scrollLeft - animation.expansionLeft;
        this.animationTop = scrollTop - animation.expansionTop;
        this.animationRight = scrollRight + animation.expansionRight;
        this.animationBottom = scrollBottom + animation.expansionBottom;
        this.animationLeftT = this.animationLeft / tileWidth;
        this.animationTopT = this.animationTop / tileHeight;
        this.animationRightT = this.animationRight / tileWidth;
        this.animationBottomT = this.animationBottom / tileHeight;
        // 计算当前缩放率的光影纹理参数
        const texture = GL.reflectedLightMap;
        if (texture.scale !== zoom) {
            texture.scale = zoom;
            const { ceil, min } = Math;
            const pl = texture.paddingLeft;
            const pt = texture.paddingTop;
            const pr = texture.paddingRight;
            const pb = texture.paddingBottom;
            const el = ceil(min(light.expansionLeft * zoom, pl));
            const et = ceil(min(light.expansionTop * zoom, pt));
            const er = ceil(min(light.expansionRight * zoom, pr));
            const eb = ceil(min(light.expansionBottom * zoom, pb));
            texture.expansionLeft = el / zoom;
            texture.expansionTop = et / zoom;
            texture.expansionRight = er / zoom;
            texture.expansionBottom = eb / zoom;
            texture.maxExpansionLeft = pl / zoom;
            texture.maxExpansionTop = pt / zoom;
            texture.maxExpansionRight = pr / zoom;
            texture.maxExpansionBottom = pb / zoom;
            texture.clipX = pl - el;
            texture.clipY = pt - et;
            texture.clipWidth = GL.width + el + er;
            texture.clipHeight = GL.height + et + eb;
        }
        // 设置光源渲染范围
        this.lightLeft = scrollLeft - texture.expansionLeft;
        this.lightTop = scrollTop - texture.expansionTop;
        this.lightRight = scrollRight + texture.expansionRight;
        this.lightBottom = scrollBottom + texture.expansionBottom;
    }
    /**
     * 保存摄像机数据
     * @returns 摄像机存档数据
     */
    saveData() {
        return {
            target: this.target?.entityId ?? '',
            x: this.x,
            y: this.y,
            zoom: this.rawZoom,
        };
    }
    /**
     * 加载摄像机数据
     * @param camera 摄像机存档数据
     */
    loadData(camera) {
        this.x = camera.x;
        this.y = camera.y;
        this.setZoomFactor(camera.zoom);
        // 获取摄像机跟随的全局角色或场景角色(如果有)
        const entityId = camera.target;
        const target = GlobalEntityManager.get(entityId);
        if (target) {
            this.follow(target);
        }
    }
    /**
     * 创建跟随目标角色的更新器
     * @returns 更新器模块
     */
    createFollowingUpdater() {
        return {
            update: () => {
                if (this.target?.destroyed === false) {
                    // 如果角色未销毁则跟随
                    this.x = this.target.x;
                    this.y = this.target.y;
                }
                else {
                    // 否则解除摄像机跟随
                    this.target = null;
                    this.updaters.deleteDelay('move');
                }
            }
        };
    }
    /**
     * 将场景坐标转换为屏幕坐标
     * @param scenePos 拥有场景坐标的对象
     * @returns 场景坐标点(公共)
     */
    convertToScreenCoords(scenePos) {
        const point = Scene.sharedPoint;
        const x = scenePos.x * Scene.binding.tileWidth;
        const y = scenePos.y * Scene.binding.tileHeight;
        point.x = (x - this.scrollLeft) / this.width * GL.width;
        point.y = (y - this.scrollTop) / this.height * GL.height;
        return point;
    }
    /**
     * 震动屏幕
     * @param mode 震动模式
     * @param power 强度
     * @param speed 速度
     * @param easingId 过渡曲线ID
     * @param duration 持续时间(ms)
     */
    shake(mode = 'random', power = 5, speed = 5, easingId = '', duration = 1000) {
        let progress = 0;
        let elapsed = 0;
        let startX = this.shakeX;
        let startY = this.shakeY;
        let endX = 0;
        let endY = 0;
        let interval = 200 / speed;
        const easing = Easing.get(easingId);
        const updateNextPosition = () => {
            switch (mode) {
                case 'random': {
                    const offset = Math.random() * power;
                    const angle = Math.random() * Math.PI * 2;
                    endX = Math.cos(angle) * offset;
                    endY = Math.sin(angle) * offset;
                    break;
                }
                case 'horizontal':
                    endX = endX < 0 ? power : -power;
                    break;
                case 'vertical':
                    endY = endY < 0 ? power : -power;
                    break;
            }
            const dist = Math.dist(startX, startY, endX, endY);
            if (elapsed === 0 || elapsed + interval < duration) {
                interval = dist * 40 / speed;
            }
            else if (startX !== 0 || startY !== 0) {
                endX = 0;
                endY = 0;
                interval = Math.dist(startX, startY, 0, 0) * 40 / speed;
            }
            else {
                this.updaters.deleteDelay('shake');
            }
        };
        updateNextPosition();
        this.updaters.set('shake', {
            update: deltaTime => {
                elapsed += deltaTime;
                progress += deltaTime;
                if (progress < interval) {
                    const time = easing.get(progress / interval);
                    this.shakeX = startX * (1 - time) + endX * time;
                    this.shakeY = startY * (1 - time) + endY * time;
                }
                else {
                    progress -= interval;
                    this.shakeX = startX = endX;
                    this.shakeY = startY = endY;
                    updateNextPosition();
                }
            }
        });
    }
};
//# sourceMappingURL=camera.js.map