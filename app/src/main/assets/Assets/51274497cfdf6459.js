/*
@plugin #plugin
@version 1.4
@author
@link
@desc #desc

@option display {'always', 'auto', 'auto-except-for-player-team', 'in-the-visible-range'}
@alias #display {#always, #auto, #auto-except-for-player-team, #in-the-visible-range}
@desc #display-desc
@default 'auto-except-for-player-team'

@number duration
@alias #duration
@desc #duration-desc
@clamp 1000 60000
@default 10000
@cond display {'auto', 'auto-except-for-player-team'}

@number range
@alias #range
@desc #range-desc
@clamp 0 100
@default 10
@cond display {'in-the-visible-range'}

@attribute-key textAttr
@alias #textAttr
@desc #textAttr-desc
@filter actor

@string template
@alias #template
@desc #template-desc
@default '<size:12><outline:000000><content>'

@number offsetY
@alias #offsetY
@desc #offsetY-desc
@clamp -400 400
@default -24

@lang en
#plugin Actor Text Display
#desc
Render text content at the actor's location when the actor has a "Text Attribute" and is visible on the screen.
#display Display
#always Always
#auto Auto
#auto-except-for-player-team Auto except for player team
#in-the-visible-range In the Visible Range
#display-desc Always show Text, or after an attack
#duration Duration (ms)
#duration-desc The duration of the text displayed after being attacked
#range Visible Range
#range-desc If the distance from the actor to the center of the camera is in the visible range, display the text
#textAttr Text Attribute
#textAttr-desc String: Display the text content at the actor location
#template Text Template
#template-desc Replace <content> with the read text when rendering text, can be set to empty string if not needed
#offsetY Offset Y
#offsetY-desc Vertical offset distance of the text

@lang zh
#plugin 角色文本显示
#desc
当角色拥有"文本属性"，并且在屏幕中可见时，在角色位置渲染文本内容。
#display 显示模式
#always 总是显示
#auto 自动
#auto-except-for-player-team 自动(玩家队伍除外)
#in-the-visible-range 在可见范围内
#display-desc 总是显示文本，或者在受到攻击后显示
#duration 持续时间(ms)
#duration-desc 受到攻击后显示文本的持续时间
#range 可见范围
#range-desc 如果角色到摄像机中心的距离在可见范围内，则显示文本
#textAttr 文本属性
#textAttr-desc 字符串类型：显示在角色位置附近的文本内容
#template 文本模板
#template-desc 渲染文本时自动替换<content>为读取到的文本，如果不需要可以设置为空字符串
#offsetY 偏移Y
#offsetY-desc 文本的垂直偏移距离
*/
let TextComponents = {};
export default class ActorTextDisplay {
    // 接口属性
    display;
    duration;
    range;
    textAttr;
    template;
    offsetY;
    // 脚本属性
    isHidden;
    onStart() {
        window.on('localize', () => {
            for (const text of Object.values(TextComponents)) {
                text.updateTextContent();
            }
        });
        window.on('rescale', () => {
            for (const text of Object.values(TextComponents)) {
                text.updatePrinter();
            }
        });
        Scene.on('load', scene => {
            scene.renderers.push(this);
        });
        Scene.on('destroy', scene => {
            const components = Object.values(TextComponents);
            for (const component of components) {
                component.destroy();
            }
            TextComponents = {};
        });
        // 创建隐藏状态检查器
        const { duration } = this;
        switch (this.display) {
            case 'always':
                this.isHidden = () => false;
                break;
            case 'auto':
                this.isHidden = actor => {
                    return Time.elapsed - actor.hitTimestamp > duration;
                };
                break;
            case 'auto-except-for-player-team':
                this.isHidden = actor => {
                    if (actor.teamId === Party.player?.teamId)
                        return false;
                    return Time.elapsed - actor.hitTimestamp > duration;
                };
                break;
            case 'in-the-visible-range': {
                const rangeSquared = this.range ** 2;
                this.isHidden = actor => {
                    return (Camera.x - actor.x) ** 2 + (Camera.y - actor.y) ** 2 > rangeSquared;
                };
                break;
            }
        }
    }
    /** 渲染文本 */
    render() {
        const textKey = this.textAttr;
        const template = this.template;
        const offsetY = this.offsetY;
        const isHidden = this.isHidden;
        const actors = Scene.visibleActors;
        const count = actors.count;
        for (let i = 0; i < count; i++) {
            const actor = actors[i];
            if (!actor.active || isHidden(actor))
                continue;
            const content = actor.attributes[textKey];
            if (typeof content !== 'string' || content === '')
                continue;
            let text = TextComponents[content];
            if (text === undefined) {
                text = new TextComponent(template ? template.replace('<content>', content) : content);
                TextComponents[content] = text;
            }
            const point = Camera.convertToScreenCoords(actor);
            const animY = actor.animation?.offsetY ?? 0;
            text.x = point.x;
            text.y = point.y + (offsetY + animY) * Camera.zoom;
            text.draw();
        }
    }
}
// 文本组件
class TextComponent {
    texture;
    printer;
    _content;
    _rawContent;
    size;
    color;
    font;
    x;
    y;
    textOuterX;
    textOuterY;
    textOuterWidth;
    textOuterHeight;
    constructor(content) {
        this.texture = null;
        this.printer = null;
        this.content = content;
        this.size = 16;
        this.color = 'ffffffff';
        this.font = '';
        this.x = 0;
        this.y = 0;
        this.textOuterX = 0;
        this.textOuterY = 0;
        this.textOuterWidth = 0;
        this.textOuterHeight = 0;
    }
    // 文本内容
    get content() {
        return this._content;
    }
    set content(value) {
        this._rawContent = value;
        this._content = Local.replace(value);
    }
    // 更新文本内容
    updateTextContent() {
        this.content = this._rawContent;
    }
    // 更新打印机
    updatePrinter() {
        const { printer } = this;
        if (printer) {
            // 重置打印机
            if (printer.content) {
                printer.reset();
            }
            // 打印文本
            printer.draw(this.content);
            this.calculateTextPosition();
        }
    }
    // 更新文本
    update() {
        let printer = this.printer;
        if (printer === null) {
            // 如果首次调用，创建打印机和纹理
            const texture = new Texture();
            printer = new Printer(texture);
            printer.sizes[0] = this.size;
            printer.colors[0] = Color.parseCSSColor(this.color);
            printer.fonts[0] = Printer.generateFontFamily(this.font);
            // printer.effects[0] = Printer.parseEffect(this.effect)
            this.texture = texture;
            this.printer = printer;
        }
        // 如果文本内容发生变化
        // 或者换行模式文本区域发生变化
        // 或者截断模式文本区域发生变化
        if (printer.content !== this.content) {
            this.updatePrinter();
        }
    }
    // 绘制图像
    draw() {
        // 更新文本
        this.update();
        // 绘制文本
        if (this.content) {
            GL.drawImage(this.texture, this.x + this.textOuterX, this.y + this.textOuterY, this.textOuterWidth, this.textOuterHeight);
        }
    }
    // 计算文本位置
    calculateTextPosition() {
        const printer = this.printer;
        if (printer !== null) {
            const pl = printer.paddingLeft / Printer.scale;
            const pt = printer.paddingTop / Printer.scale;
            const pr = printer.paddingRight / Printer.scale;
            const pb = printer.paddingBottom / Printer.scale;
            const outerWidth = this.texture.width / Printer.scale;
            const outerHeight = this.texture.height / Printer.scale;
            const innerWidth = outerWidth - pl - pr;
            const innerHeight = outerHeight - pt - pb;
            this.textOuterX = (-pl - innerWidth / 2) * UI.scale;
            this.textOuterY = (-pt - innerHeight / 2) * UI.scale;
            this.textOuterWidth = outerWidth * UI.scale;
            this.textOuterHeight = outerHeight * UI.scale;
        }
    }
    // 销毁元素
    destroy() {
        this.texture?.destroy();
    }
}
//# sourceMappingURL=%E8%A7%92%E8%89%B2%E6%96%87%E6%9C%AC%E6%98%BE%E7%A4%BA.51274497cfdf6459.js.map