/*
@plugin #plugin
@version 1.0
@author
@link
@desc #desc

@option display {'windowed', 'maximized', 'fullscreen'}
@alias #display {#windowed, #maximized, #fullscreen}

@lang en
#plugin Set Display Mode
#desc Set the display mode of the application
#display Display
#windowed Windowed
#maximized Maximized
#fullscreen Fullscreen

@lang zh
#plugin 设置显示模式
#desc 设置应用的显示模式
#display 显示模式
#windowed 窗口模式
#maximized 窗口最大化
#fullscreen 全屏
*/
export default class SwitchWindowDisplay {
    // 接口属性
    display;
    call() {
        if (window.process) {
            Data.config.window.display = this.display;
            const path = Loader.route('Data/config.json');
            const json = JSON.stringify(Data.config, null, 2);
            Data.writeFile(path, json);
            require('electron').ipcRenderer.send('set-display-mode', this.display);
        }
    }
}
//# sourceMappingURL=%E8%AE%BE%E7%BD%AE%E6%98%BE%E7%A4%BA%E6%A8%A1%E5%BC%8F.%E6%8C%87%E4%BB%A4.980f97b3d02a6b0f.js.map