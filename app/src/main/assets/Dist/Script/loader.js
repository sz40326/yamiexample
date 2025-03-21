/** ******************************** 文件加载器 ******************************** */
let Loader = new class FileLoader {
    /** 是否已完成加载 */
    complete = true;
    /** 已加载字节数 */
    loadedBytes = 0;
    /** 总字节数 */
    totalBytes = 0;
    /** 加载完成进度 */
    completionProgress = 0;
    /** 加载进度列表 */
    loadingProgressList = [];
    /** 等待加载 */
    promise = Promise.resolve();
    /** 完成加载 */
    resolve = Function.empty;
    /** {guid:图像}缓存表 */
    cachedImages = {};
    /** {guid:缓存链接}映射表 */
    cachedUrls = {};
    /** {url:二进制文件}缓存表 */
    cachedBlobs = {};
    /**
     * 完成加载
     */
    finish() {
        if (this.loadingProgressList.length !== 0) {
            this.loadingProgressList.length = 0;
            this.complete = true;
            this.loadedBytes = 0;
            this.totalBytes = 0;
            this.completionProgress = 0;
            this.resolve();
        }
    }
    /**
     * 预加载文件
     */
    async preload() {
        const { preload, deployed } = Data.config;
        if (preload === 'never' ||
            preload === 'deployed' && !deployed) {
            return;
        }
        // 筛选出需要加载的文件，并统计字节数
        const images = [];
        const audio = [];
        let totalBytes = 0;
        for (const { guid, size } of Data.manifest.images) {
            if (size !== 0) {
                totalBytes += size;
                images.push(guid);
            }
        }
        for (const { path, size } of Data.manifest.audio) {
            if (size !== 0) {
                totalBytes += size;
                audio.push(path);
            }
        }
        // 临时修改相关方法
        // 等待预加载事件中的文件加载完毕
        const { finish } = this;
        this.finish = () => {
            finish.call(this);
            this.totalBytes = totalBytes;
        };
        this.finish();
        this.updateLoadingStats = Function.empty;
        EventManager.emit('preload');
        await this.promise;
        // @ts-ignore
        delete this.updateLoadingStats;
        // 开始预加载文件
        const promises = [];
        for (const guid of images) {
            promises.push(Loader.loadImage({ guid }));
        }
        for (const path of audio) {
            promises.push(Loader.getBlobUrl(path));
        }
        await Promise.all(promises);
    }
    /**
     * 解密文件
     * @returns 解密后的数据
     */
    async decrypt(options) {
        const { path, type } = options;
        const buffer = window.decrypt(await Loader.xhr({ path, type: 'arraybuffer' }));
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
    async get(descriptor) {
        // 可以指定路径或GUID来加载文件
        const guid = descriptor.guid ?? '';
        const path = descriptor.path ?? this.getPathByGUID(guid);
        const type = descriptor.type;
        switch (type) {
            case 'image':
                return this.loadImage({ guid, path });
            default:
                return /\.dat$/.test(path)
                    ? this.decrypt({ path, type })
                    : this.xhr({ path, type });
        }
    }
    /**
     * 使用XHR方法加载文件
     * @returns 响应数据
     */
    xhr({ path, type }) {
        return new Promise((resolve, reject) => {
            const meta = Data.manifest?.pathMap[path];
            const size = meta?.size ?? 0;
            const request = new XMLHttpRequest();
            const progress = new LoadingProgress(size);
            // 开始新的加载任务
            if (this.complete) {
                this.complete = false;
                this.promise = new Promise(resolve => {
                    this.resolve = resolve;
                });
            }
            this.loadingProgressList.push(progress);
            // 更新加载进度
            request.onloadstart =
                request.onprogress = event => {
                    progress.update(event);
                };
            request.onload = event => {
                progress.update(event);
                resolve(request.response);
            };
            request.onerror = event => {
                progress.loaded = size;
                reject(request.response);
            };
            request.open('GET', path);
            request.responseType = type;
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
    /**
     * 获取缓存图像
     * @returns 图像DOM元素
     */
    getImage({ guid, path }) {
        if (guid === undefined) {
            guid = '';
        }
        if (path === undefined) {
            path = this.getPathByGUID(guid);
        }
        const key = path ?? guid;
        const image = this.cachedImages[key];
        return image instanceof HTMLImageElement ? image : null;
    }
    /**
     * 加载缓存图像
     * @returns 图像DOM元素
     */
    async loadImage({ guid, path, save }) {
        guid = guid ?? '';
        path = path ?? this.getPathByGUID(guid);
        save = save ?? false;
        const key = path ?? guid;
        const images = this.cachedImages;
        return images[key] ??=
            new Promise(async (resolve) => {
                const image = new Image();
                // 给图像元素设置guid用于纹理的查找
                image.guid = guid;
                // 加载图像资源
                image.onload =
                    image.onerror = () => {
                        if (!save) {
                            this.revokeBlobUrl(image.src);
                        }
                        images[key] = image;
                        image.onload = null;
                        image.onerror = null;
                        resolve(image);
                    };
                image.src = await this.getBlobUrl(path);
            });
    }
    /**
     * 获取二进制对象链接
     * @param path 原生路径
     * @returns 二进制对象链接
     */
    async getBlobUrl(path) {
        const { cachedUrls } = this;
        const url = cachedUrls[path];
        // 返回已经缓存的链接
        if (typeof url === 'string') {
            return url;
        }
        // 先暂时把原始链接作为缓存链接
        // 等待文件加载后生成并替换缓存链接
        cachedUrls[path] = path;
        try {
            let buffer = await Loader.xhr({
                path: path,
                type: 'arraybuffer',
            });
            if (/\.dat$/.test(path)) {
                buffer = window.decrypt(buffer);
            }
            const blob = new Blob([buffer]);
            const url = URL.createObjectURL(blob);
            this.cachedBlobs[url] = blob;
            return cachedUrls[path] = url;
        }
        catch (error) {
            return '';
        }
    }
    /**
     * 撤回二进制对象链接(释放内存)
     * @param url 二进制对象链接
     */
    revokeBlobUrl(url) {
        if (url in this.cachedBlobs) {
            delete this.cachedBlobs[url];
            URL.revokeObjectURL(url);
        }
    }
    /**
     * 获取二进制对象或原生链接
     * @param path 原生路径
     */
    getBlobOrRawUrl(guid) {
        const path = this.getPathByGUID(guid);
        return this.cachedUrls[path] ?? path;
    }
    /**
     * 更新加载进度
     * @param deltaTime 增量时间
     */
    update(deltaTime) {
        // 如果不存在加载进度，则返回
        if (this.complete) {
            return this.finish();
        }
        const { loadingProgressList } = this;
        // 统计已加载和总的数据字节大小
        let loaded = 0;
        let total = 0;
        let complete = true;
        for (const progress of loadingProgressList) {
            loaded += progress.loaded;
            total += progress.total || progress.fileSize;
            if (!progress.isComplete()) {
                complete = false;
            }
        }
        // 计算加载进度
        this.complete = complete;
        this.updateLoadingStats(loaded, total);
    }
    /** 更新统计数据 */
    updateLoadingStats(loaded, total) {
        this.loadedBytes = loaded;
        this.totalBytes = total;
        this.completionProgress = loaded / (total || Infinity);
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
    /** 文件大小 */
    fileSize;
    constructor(fileSize) {
        this.loaded = 0;
        this.total = 0;
        this.lengthComputable = false;
        this.fileSize = fileSize;
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