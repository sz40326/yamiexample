/*
@plugin #plugin
@version 1.0
@author
@link
@desc #desc

@lang en
#plugin Exit the Game
#desc For desktop application mode

@lang zh
#plugin 退出游戏
#desc 桌面应用模式专用
*/
export default class ExitTheGame {
    call() {
        if (Stats.shell === 'electron') {
            window.close();
        }
    }
}
//# sourceMappingURL=%E9%80%80%E5%87%BA%E6%B8%B8%E6%88%8F.%E6%8C%87%E4%BB%A4.bc72195fc998f0af.js.map