/*
@plugin #plugin
@version 1.0
@author
@link

@number speedDev
@alias #speedDev
@clamp 0 100

@number angleDev
@alias #angleDev
@clamp 0 360

@number durationDev
@alias #durationDev
@clamp 0 36000

@lang en
#plugin Trigger - Random Parameters
#speedDev Speed Deviation
#angleDev Angle Deviation
#durationDev Duration Deviation

@lang zh
#plugin 触发器 - 随机参数
#speedDev 速度偏差
#angleDev 角度偏差
#durationDev 持续时间偏差
*/
/**
 * 计算离散率
 * @param variance 离散度
 * @returns 随机离散值(-variance ~ + variance)
 */
const vary = (variance) => {
    return variance === 0 ? 0 : variance * (Math.random() - Math.random());
};
export default class Trigger_Adjustment {
    // 接口属性
    speedDev;
    angleDev;
    durationDev;
    onStart(trigger) {
        if (this.speedDev !== 0) {
            const dev = vary(this.speedDev);
            const speed = Math.max(trigger.speed + dev, 0);
            trigger.setSpeed(speed);
        }
        if (this.angleDev !== 0) {
            const dev = vary(Math.radians(this.angleDev));
            const angle = Math.max(trigger.angle + dev, 0);
            trigger.setAngle(angle);
        }
        if (this.durationDev !== 0) {
            const dev = vary(this.durationDev);
            const duration = Math.max(trigger.duration + dev, 0);
            trigger.duration = duration;
        }
    }
}
//# sourceMappingURL=%E8%A7%A6%E5%8F%91%E5%99%A8_%E9%9A%8F%E6%9C%BA%E5%8F%82%E6%95%B0.e6bc00a65d2cb60d.js.map