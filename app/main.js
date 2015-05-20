/**
 * Created by LUOWEN on 2015-05-19.
 */
define(function (require, exports, module) {

    var createjs = window.createjs || {},
        SPRITE_LABELS = require('./components/SpriteLabels'),
        utils = require("./components/Utils"),
        fairy = {
            eye: null,
            body: null,
            mouth: null
        },
        stage, queue, fairyData, spriteSheet;

    var allSprites = [];
    var game = window.game || {};

    stage = new createjs.Stage("stage");
    stage.enableMouseOver(24); // 24 updates per second
    createjs.Ticker.timingMode = createjs.Ticker.RAF;
    createjs.Ticker.setFPS(24);
    createjs.Ticker.addEventListener("tick", tick);

    queue = new createjs.LoadQueue();
    queue.installPlugin(createjs.Sound);
    queue.on("complete", handleComplete, this);
    //queue.loadFile({id:"sound", src:"http://path/to/sound.mp3"});
    queue.loadManifest([
        {id: "myfairy", src: "./assets/role_main_fairy.json"}
    ]);

    function handleComplete() {
        fairyData = queue.getResult('myfairy');
        spriteSheet = new createjs.SpriteSheet(fairyData);

        fairy.eye = new createjs.Sprite(spriteSheet, SPRITE_LABELS.EYE_STATIC);
        fairy.body = new createjs.Sprite(spriteSheet, SPRITE_LABELS.FAIRY);
        fairy.mouth = new createjs.Sprite(spriteSheet, SPRITE_LABELS.MOUTH_STATIC);

        stage.addChild(fairy.body, fairy.eye, fairy.mouth);

        allSprites.push(fairy.body);
        allSprites.push(fairy.eye);
        allSprites.push(fairy.mouth);

        setListeners();
    }

    function setListeners() {
        _.each(allSprites, function(v, k){
            utils.initDrag(v);
            utils.initMouseOverChoose.call(this, v);
        }, this);

    }

    function tick() {
        stage.update();
    }

});