/** ******************************** 文件加载器 ******************************** */
let Loader = new class FileLoader {
    /** 同步加载文件映射表 */
    syncLoadings = new Map();
    /** 加载文件Promise集合 */
    loadingPromises = {};
    /** 加载进度 */
    loadingProgress = 0;
    /** 游戏文件缓存列表 */
    cachedBlobs = [];
    /** {guid:缓存链接}映射表 */
    cachedUrls = {};
    /**
     * 解密文件
     * @returns 解密后的数据
     */
    async decrypt(options) {
        const { path, type, sync } = options;
        const buffer = window.decrypt(await Loader.xhr({ path, sync, type: 'arraybuffer' }));
        switch (type) {
            case 'text':
                return Codec.textDecoder.decode(buffer);
            case 'json':
                return JSON.parse(Codec.textDecoder.decode(buffer));
            case 'arraybuffer':
                return buffer;
        }
    }
    /**
     * 获取文件
     * @param descriptor 文件描述器
     * @returns 文件数据
     */
    get(descriptor) {
        // 可以指定路径或GUID来加载文件
        let path = descriptor.path;
        const guid = descriptor.guid ?? '';
        const type = descriptor.type;
        const sync = descriptor.sync ?? false;
        switch (type) {
            case 'image': {
                const key = path ?? guid;
                const { loadingPromises } = this;
                // 如果当前图像已在加载中，则返回Promise，否则新建
                return loadingPromises[key] || (loadingPromises[key] = new Promise(async (resolve) => {
                    const image = new Image();
                    // 给图像元素设置guid用于纹理的查找
                    image.guid = guid;
                    // 加载图像资源
                    image.onload = () => {
                        delete loadingPromises[key];
                        image.onload = null;
                        image.onerror = null;
                        resolve(image);
                    };
                    image.onerror = () => {
                        delete loadingPromises[key];
                        image.onload = null;
                        image.onerror = null;
                        image.src = '';
                        resolve(null);
                    };
                    image.src = path ?? await Loader.getCachedUrl(guid, sync);
                }));
            }
            default:
                if (path === undefined) {
                    path = this.getPathByGUID(guid);
                }
                return /\.dat$/.test(path)
                    ? this.decrypt({ path, sync, type })
                    : this.xhr({ path, sync, type });
        }
    }
    /**
     * 使用XHR方法加载文件
     * @returns 响应数据
     */
    xhr(options) {
        return new Promise((resolve, reject) => {
            const request = new XMLHttpRequest();
            if (options.sync) {
                // 同步加载即时更新进度
                request.onloadstart =
                    request.onprogress = event => {
                        this.syncLoadings.set(request, new LoadingProgress(event));
                    };
                request.onload = event => {
                    this.syncLoadings.set(request, new LoadingProgress(event));
                    resolve(request.response);
                };
                request.onerror = event => {
                    this.syncLoadings.delete(request);
                    reject(request.response);
                };
            }
            else {
                // 异步加载
                request.onload = event => resolve(request.response);
                request.onerror = event => reject(request.response);
            }
            request.open('GET', options.path);
            request.responseType = options.type;
            request.send();
        });
    }
    /**
     * 获取本地文件路径(Node.js)
     * @param relativePath 相对路径
     * @returns 绝对路径
     */
    route(relativePath) {
        return require('path').resolve(__dirname, relativePath);
    }
    /**
     * 获取存档文件路径(Node.js)
     * @param relativePath 相对路径
     * @returns 绝对路径
     */
    routeSave(relativePath) {
        return require('path').resolve(Data.saveDir, relativePath);
    }
    /**
     * 获取文件路径(通过GUID)
     * @param guid 文件GUID
     * @returns 文件路径或空字符串
     */
    getPathByGUID(guid) {
        return Data.manifest.guidMap[guid]?.path ?? '';
    }
    /** 获取缓存链接 */
    async getCachedUrl(guid, sync = false) {
        const { cachedUrls } = this;
        const url = cachedUrls[guid];
        // 返回已经缓存的链接
        if (typeof url === 'string') {
            return url;
        }
        // 先暂时把原始链接作为缓存链接
        // 等待文件加载后生成并替换缓存链接
        const path = Loader.getPathByGUID(guid);
        cachedUrls[guid] = path;
        try {
            let buffer = await Loader.xhr({
                path: path,
                sync: sync,
                type: 'arraybuffer',
            });
            if (/\.dat$/.test(path)) {
                buffer = window.decrypt(buffer);
            }
            const blob = new Blob([buffer]);
            const url = URL.createObjectURL(blob);
            this.cachedBlobs.push(blob);
            return cachedUrls[guid] = url;
        }
        catch (error) {
            return '';
        }
    }
    /**
     * 更新同步加载进度
     * @returns 加载是否完成
     */
    updateLoadingProgress() {
        // 如果不存在同步加载，则继续
        const { syncLoadings } = this;
        if (syncLoadings.size === 0) {
            return false;
        }
        // 统计已加载和总的数据字节大小
        let loaded = 0;
        let total = 0;
        let complete = true;
        for (const progress of syncLoadings.values()) {
            if (progress.lengthComputable) {
                loaded += progress.loaded;
                total += progress.total;
            }
            if (!progress.isComplete()) {
                complete = false;
            }
        }
        // 计算加载进度
        this.loadingProgress = loaded / (total || Infinity);
        // 加载进度为100%，不存在未知数据大小，已导入所有字体，则判定为加载完成
        if (complete && !Printer.importing.length) {
            // 删除同步加载进度表中的所有键值对
            for (const key of syncLoadings.keys()) {
                syncLoadings.delete(key);
            }
            // 移除进度条后继续
            GL.container.progress &&
                GL.container.progress.remove();
            return false;
        }
        // 未加载完成
        return true;
    }
    /** 渲染同步加载进度 */
    renderLoadingProgress() {
        if (!GL)
            return;
        // 擦除游戏画布内容(显示为黑屏)
        GL.clearColor(0, 0, 0, 0);
        GL.clear(GL.COLOR_BUFFER_BIT);
        // 只有Web模式下才会显示进度条
        if (!Stats.isOnClient) {
            if (!GL.container.progress) {
                // 创建进度条并设置样式
                const progress = document.createElement('div');
                progress.style.position = 'absolute';
                progress.style.left = '0';
                progress.style.bottom = '0';
                progress.style.height = '10px';
                progress.style.backgroundImage = `
        linear-gradient(
          to right,
          white 0%,
          white 33%,
          transparent 33%,
          transparent 100%
        )`;
                progress.style.backgroundSize = '3px 1px';
                progress.style.pointerEvents = 'none';
                // 设置移除进度条方法(加载完成时调用)
                progress.remove = () => {
                    delete GL.container.progress;
                    GL.container.removeChild(progress);
                };
                // 添加进度条到容器元素中
                GL.container.progress = progress;
                GL.container.appendChild(progress);
            }
            // 更新当前的进度
            const percent = Math.round(this.loadingProgress * 100);
            if (GL.container.progress.percent !== percent) {
                GL.container.progress.percent = percent;
                GL.container.progress.style.width = `${percent}%`;
            }
        }
    }
};
/** ******************************** 加载进度 ******************************** */
class LoadingProgress {
    /** 已加载字节数 */
    loaded;
    /** 总的字节数 */
    total;
    /** 是否可计算长度 */
    lengthComputable;
    constructor(event) {
        this.loaded = event.loaded;
        this.total = event.total;
        this.lengthComputable = event.lengthComputable;
    }
    /** 更新加载数据 */
    update(event) {
        this.loaded = event.loaded;
        this.total = event.total;
        this.lengthComputable = event.lengthComputable;
    }
    /**
     * 是否加载完成
     * @returns 完成状态
     */
    isComplete() {
        return this.lengthComputable && this.loaded === this.total;
    }
}
/** ******************************** 全局唯一标识符 ******************************** */
let GUID = new class GuidGenerator {
    /** 检查用的正则表达式 */
    regExpForChecking = /[a-f]/;
    /**
     * 生成32位GUID(8个字符)
     * @returns 32位GUID
     */
    generate32bit() {
        const n = Math.random() * 0x100000000;
        const s = Math.floor(n).toString(16);
        return s.length === 8 ? s : s.padStart(8, '0');
    }
    /**
     * 生成64位GUID(16个字符)
     * @returns 64位GUID
     */
    generate64bit() {
        let id;
        // GUID通常用作哈希表的键
        // 避免纯数字的键(会降低访问速度)
        do {
            id = this.generate32bit() + this.generate32bit();
        } while (!this.regExpForChecking.test(id));
        return id;
    }
};
//# sourceMappingURL=loader.js.map