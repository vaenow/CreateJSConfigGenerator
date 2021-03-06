/**
 * Created by LUOWEN on 2015-05-20.
 */
define(function (require, exports, modules) {
    var switcher = require('../switcher');

    var utils = exports;

    utils.ERR_SCOPE_NEED_TO_BE_CHANGED = "The scope need to be changed!";

    utils.getRandomInt = function (end, start) {
        return (Math.random() * (end - (start || 0)) + (start || 0)) | 0;
    };

    utils.setRegPoint = function (obj, posNum, fixOffset, x, y) {
        /**
         *   position number
         *  -----------------
         *     1   2   3
         *     4   5   6
         *     7   8   9
         */
        if (!obj || isNaN(posNum)) return;
        var ratio = {};
        var old = obj.getTransformedBounds();
        var prePt = {x: obj.x, y: obj.y};
        //if(fixOffset == null) fixOffset=!0;
        switch (posNum) {
            case 1 :
                ratio.x = 0;
                ratio.y = 0;
                break;
            case 2 :
                ratio.x = 0.5;
                ratio.y = 0;
                break;
            case 3 :
                ratio.x = 1;
                ratio.y = 0;
                break;
            case 4 :
                ratio.x = 0;
                ratio.y = 0.5;
                break;
            case 5 :
                ratio.x = ratio.y = 0.5;
                break;
            case 6 :
                ratio.x = 1;
                ratio.y = 0.5;
                break;
            case 7 :
                ratio.x = 0;
                ratio.y = 1;
                break;
            case 8 :
                ratio.x = 0.5;
                ratio.y = 1;
                break;
            case 9 :
                ratio.x = 1;
                ratio.y = 1;
                break;
            default :                  // Coustomized ratio
                ratio.x = x / old.width;
                ratio.y = y / old.height;
                console.log("position num error:", posNum);
        }
        obj.set({
            regX: old.width / obj.scaleX * ratio.x,
            regY: old.height / obj.scaleY * ratio.y,
            x: old.x + old.width * ratio.x,
            y: old.y + old.height * ratio.y,
            regPt: posNum || '-1'
        });
        if (fixOffset) obj.set(prePt);
    };

    utils.getRecursiveChildren = function (name, container, isGroup) {
        if (this == utils) throw utils.ERR_SCOPE_NEED_TO_BE_CHANGED;

        var child, children, c;
        container = container || this;
        if (isGroup) child = utils.getChildrenByGroupName.call(this, name, container);
        else child = container.getChildByName(name);
        if (!child) {
            children = container.children;
            for (c in children) {
                if (children[c].children) {
                    child = arguments.callee(name, children[c], isGroup);
                    if (child) break;
                }
            }
        }
        return child;
    };

    utils.getChildrenByGroupName = function (groupName, container) {
        if (this == utils) throw utils.ERR_SCOPE_NEED_TO_BE_CHANGED;

        var childrenGroup = null, children, c, i, l;
        container = container || this;
        children = container.children;
        for (i = 0, l = children.length; i < l; i++) {
            c = children[i];
            if (c.group === groupName) {
                if (!childrenGroup) childrenGroup = [];
                childrenGroup.push(c);
            }
        }
        return childrenGroup;
    };

    /********** init *************/
    utils.initMouseOverChoose = function (stage) {
        stage.on("stagemousemove", handleStageMouseMove, this);
        stage.on("stagemousedown", handleStageMouseDown, this);
        stage.on("stagemouseup", handleStageMouseUp, this);

        function handleStageMouseMove(event) {
            if (game.d && game.d.g)
                game.d.g.clear();

            var target = stage.getObjectUnderPoint(event.stageX, event.stageY);
            if (!target) return;

            if (switcher.isGroup()) {
                handleSwitcherGroup(target);
            } else {
                handleSwitcherSingle(target);
            }
            //clearHitArea(null, false);
        }

        function handleStageMouseDown(event) {
            if(!switcher.isGroup()) return;

            //clearHitArea(null, false);
            var obj = stage.getObjectUnderPoint(event.stageX, event.stageY);
            obj && obj.parent && (obj.parent.hitArea = obj);
        }

        function handleStageMouseUp(event) {
            console.log("handleStageMouseUp");
            clearHitArea();
        }

        function clearHitArea(target, clear) {
            target = target || stage;//getTopParent(target);
            clear = clear === undefined ? true : !!clear;

            var callee = arguments.callee;
            if (target.children) {
                _.each(target.children, function (v) {
                    callee.call(this, v);
                }, this);
            }

            clear
                ? target.hitArea = null
                : target.hitArea && console.log("show", target.name, '---', target.hitArea && target.hitArea.name)
        }

        function handleSwitcherGroup(target) {
            //鼠标mousedown之后，使用hitArea已经把target切换为target.parent
            //如果target是Container,那么状态为 hover && !mousedown
            //如果target不是Container,那么状态为 hover && mousedown
            if (!(target instanceof createjs.Container)) {
                target = target.parent;
            }

            utils.eachRec(target, utils.debugDrawArea, this, true);
        }

        function handleSwitcherSingle(target) {
            utils.debugDrawArea.call(this, target, true);
        }
    };

    utils.initClickChoose = function (o, once) {
        o.on("click", handleClickChoose, this, once || false);
        function handleClickChoose(evt) {
            utils.debugDrawArea.call(this, evt.target, true);
        }
    };

    utils.initDrag = function (o, once) {
        if (utils.isString(o))
            o = this.getRecursiveChildren(o);

        o.on("mousedown", handleDrag, this, once || false);
        function handleDrag(evt) {
            if (evt.target instanceof createjs.Shape) return;

            var offset = {
                x: evt.target.x - evt.stageX,
                y: evt.target.y - evt.stageY
            };

            evt.target.on("pressmove", function (ev) {
                ev.stopPropagation();
                this.x = ev.stageX + offset.x;
                this.y = ev.stageY + offset.y;
                //console.log(this.name, " Global: ", this.localToGlobal(0, 0).x, this.localToGlobal(0, 0).y, " Local: ", this.x, this.y);
            }, evt.target);

            evt.target.on("pressup", function (ev) {
                console.log("drag & move");
                this.dispatchEvent(new createjs.Event("move over", true));
            }, evt.target);
        }
    };

    /********** is *************/

    utils.isString = function (s) {
        return typeof(s) === 'string' || s instanceof String;
    };

    utils.isArray = function (a) {
        return a instanceof Array;
    };


    /********** debug ************/
        // Draw a rectangle shape of objects to debug.
    utils.debugDrawArea = function (name, color, isSync) {
        if (this == utils) throw utils.ERR_SCOPE_NEED_TO_BE_CHANGED;
        var s;
        if (utils.isString(name)) s = utils.getRecursiveChildren.call(this, name);
        else if (name instanceof createjs.DisplayObject) s = name;
        else console.error("some bad thing happened");
        if (!s) return;

        if (color === true && !s.debugColor) {     //random color
            var colors = ["red", "orange", "yellow", "green", "blue", "purple"];
            s.debugColor = colors[utils.getRandomInt(colors.length)];
        } else if (utils.isString(color)) {
            s.debugColor = color
        }
        var p = {};

        p.x = s.localToGlobal(0, 0).x;
        p.y = s.localToGlobal(0, 0).y;
        p.w = utils.getSpriteMaxBounds(s).width;
        p.h = utils.getSpriteMaxBounds(s).height;
        /*p.w = s.getTransformedBounds().width;
         p.h = s.getTransformedBounds().height;*/
        if (!game.d) {
            game.d = {};
        }
        if (!game.d.g) {
            game.d.g = game.stage.addChild(new createjs.Shape()).graphics;
        }
        game.d.g.s(s.debugColor || 'red').dr(p.x, p.y, p.w, p.h);
        //        return s;
        if (isSync) s.on("move over", function () {
            game.d.g.clear();
            utils.debugDrawArea.call(this, name);
        }, this);
    };
    /**
     * 利用坐标数组，在游戏中画出点阵图
     * @param points
     * @param colorful
     */
    utils.debugDrawPoints = function (points, colorful) {
        if (!utils.isArray(points)) {
            console.error("points must be Array !");
            return;
        }
        if (points.length % 2 !== 0) {
            console.error("points' length must be EVEN !");
            return;
        }

        game.d = game.d || {};
        game.d.g = game.d.g || game.stage.addChild(new createjs.Shape()).graphics;

        var debugColor = 'red';
        colorful = colorful || true;
        if (colorful) { //随机颜色
            var colors = ["red", "orange", "yellow", "green", "blue", "purple"];
            debugColor = colors[utils.getRandomInt(colors.length)];
        } else if (utils.isString(colorful)) { //自定义颜色
            debugColor = colorful
        }

        while (points.length) {
            game.d.g.s(debugColor).f(debugColor).dc(points.shift(), points.shift(), 4);
        }
    };

    utils.getSpriteMaxBounds = function (sprite) {
        if (!(sprite instanceof createjs.Sprite)) return {width: 0, height: 0};
        if (sprite.cacheMaxBounds) return sprite.cacheMaxBounds;

        var frames = sprite.spriteSheet._data[sprite.currentAnimation].frames;
        var maxWidth = 0, maxHeight = 0;

        _.each(frames, function (v) {
            var rect = sprite.spriteSheet._frames[v].rect;
            maxWidth = rect.width > maxWidth ? rect.width : maxWidth;
            maxHeight = rect.height > maxHeight ? rect.height : maxHeight;
        });

        return sprite.cacheMaxBounds = {width: maxWidth, height: maxHeight};
    };

    utils.eachRec = function (container, callback, scope, params) {
        if (!(container instanceof createjs.Container)) return;
        var callee = arguments.callee;

        _.each(container.children, function (v, k) {
            if (v instanceof createjs.Container) {
                callee.call(this, v, callback, scope, params);
            }
            callback && callback.apply(scope, Array.prototype.concat.call(v, params));
        }, this);

    };

    modules.exports = utils;
    game.utils = utils;
});