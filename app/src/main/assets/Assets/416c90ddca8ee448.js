/*
@plugin #plugin
@version 1.0
@author
@link
@desc #desc

@position-getter position
@alias #position

@lang en
#plugin Set Map Marker
#desc A Command for Map Marker Plugin
#position Target Position

@lang zh
#plugin 设置地图标记
#desc 地图标记插件的相关指令
#position 目标位置
*/
export default class SetMapMarker {
    // 接口属性
    position;
    call() {
        if (this.position) {
            const { x, y } = this.position;
            PluginManager.MapMarker?.set(x, y);
        }
    }
}
//# sourceMappingURL=%E5%9C%B0%E5%9B%BE%E6%A0%87%E8%AE%B0.%E6%8C%87%E4%BB%A4.416c90ddca8ee448.js.map