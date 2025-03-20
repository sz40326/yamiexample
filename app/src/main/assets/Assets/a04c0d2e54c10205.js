/*
@plugin #plugin
@version 1.0
@author
@link
@desc #desc

@number startDelay
@alias #startDelay
@desc #startDelay-desc
@clamp 0 60000

@number duration
@alias #duration
@desc #duration-desc
@clamp 0 60000
@default 1000

@number weakMagnitude
@alias #weakMagnitude
@desc #weakMagnitude-desc
@decimals 4
@clamp 0 1
@default 1

@number strongMagnitude
@alias #strongMagnitude
@desc #strongMagnitude-desc
@decimals 4
@clamp 0 1
@default 1

@lang en
#plugin Gamepad Vibration
#desc This is an experimental technology that currently only works in the Chromium browser
#startDelay Start Delay
#startDelay-desc The delay in milliseconds before the effect is started.
#duration Duration
#duration-desc The duration of the effect in milliseconds.
#weakMagnitude Weak Magnitude
#weakMagnitude-desc Rumble intensity of the high-frequency (weak) rumble motors, normalized to the range between 0.0 and 1.0.
#strongMagnitude Strong Magnitude
#strongMagnitude-desc Rumble intensity of the low-frequency (strong) rumble motors, normalized to the range between 0.0 and 1.0.

@lang zh
#plugin 手柄震动
#desc 这是一项实验性技术，目前只能在Chromium浏览器中工作
#startDelay 初始延时
#startDelay-desc 效果开始前的延迟（以毫秒为单位）。
#duration 持续时间
#duration-desc 效果的持续时间（以毫秒为单位）。
#weakMagnitude 弱震动幅度
#weakMagnitude-desc 高频（弱）隆隆声电机的强度，归一化为 0.0 到 1.0 之间的范围。
#strongMagnitude 强震动幅度
#strongMagnitude-desc 低频（强）隆隆声电机的强度，归一化为 0.0 到 1.0 之间的范围。
*/
// ******************************** 游戏手柄 ********************************
export default class GamepadVibration {
    // 接口属性
    startDelay;
    duration;
    weakMagnitude;
    strongMagnitude;
    onStart() {
        Game.on('quit', () => this.resetEffect());
    }
    call() {
        return this.playEffect();
    }
    /** 获取游戏手柄 */
    getGamepad() {
        const pads = navigator.getGamepads();
        for (const pad of pads) {
            if (pad)
                return pad;
        }
        return null;
    }
    /** 播放震动效果 */
    playEffect() {
        const pad = this.getGamepad();
        if (pad === null)
            return;
        // @ts-ignore
        if (pad.vibrationActuator?.type === 'dual-rumble') {
            pad.vibrationActuator.playEffect('dual-rumble', {
                startDelay: this.startDelay,
                duration: this.duration,
                weakMagnitude: this.weakMagnitude,
                strongMagnitude: this.strongMagnitude,
            });
        }
    }
    /** 重置震动效果 */
    resetEffect() {
        const pad = this.getGamepad();
        if (pad === null)
            return;
        // @ts-ignore
        if (pad.vibrationActuator?.type === 'dual-rumble') {
            pad.vibrationActuator.playEffect('dual-rumble', {
                startDelay: 0,
                duration: 0,
                weakMagnitude: 0,
                strongMagnitude: 0,
            });
        }
    }
}
//# sourceMappingURL=%E6%89%8B%E6%9F%84%E9%9C%87%E5%8A%A8.%E6%8C%87%E4%BB%A4.a04c0d2e54c10205.js.map