/*
@plugin #plugin
@version
@author
@link
@desc #desc

@string codes
@default '9527'

@lang en
#plugin Developer Tools Startup Password
#desc Enter password to open the developer tools after deployment

@lang zh
#plugin 开发者工具启动密码
#desc 部署后输入密码打开开发者工具
*/
export default class DevTools {
    codes;
    onStart() {
        const chars = this.codes.split('');
        for (let i = 0; i < chars.length; i++) {
            chars[i] = chars[i].trim().toLowerCase();
        }
        let index = 0;
        window.on('keydown', event => {
            if (document.activeElement !== document.body) {
                index = 0;
            }
            else {
                switch (event.key) {
                    case chars[index]:
                        if (++index === chars.length) {
                            index = 0;
                            require('electron').ipcRenderer.send('open-devTools');
                        }
                        break;
                    case chars[0]:
                        index = 1;
                        break;
                    default:
                        index = 0;
                        break;
                }
            }
        });
    }
}
//# sourceMappingURL=%E5%BC%80%E5%8F%91%E8%80%85%E5%B7%A5%E5%85%B7%E5%AF%86%E7%A0%81.812784b903077a6a.js.map