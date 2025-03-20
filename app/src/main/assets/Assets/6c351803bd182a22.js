/*
@plugin 移动端-安卓API
@version 1.0
@author 徐然
@link https://space.bilibili.com/291565199
@desc

注意：本指令仅适用于徐然安卓壳。

@option emitCommand {"退出APP"}
@alias API
@desc 调用API

*/
/** 自定义指令脚本 */
export default class CommandScript {
    emitCommand;
    EventFileCallBack;
    constructor() {
        this.emitCommand = "";
        this.EventFileCallBack = null;
    }
    checkEnv() {
        if (!window.JSApi) {
            console.warn("当前环境不是徐然安卓壳，无法执行！");
            return false;
        }
        return true;
    }
    call() {
        switch (this.emitCommand) {
            case "退出APP":
                if (this.checkEnv()) {
                    window.JSApi?.exitApp();
                }
                break;
        }
    }
}
//# sourceMappingURL=%E7%A7%BB%E5%8A%A8%E7%AB%AF-API%E6%8C%87%E4%BB%A4.6c351803bd182a22.js.map