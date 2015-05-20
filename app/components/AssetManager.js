/**
 * Created by LUOWEN on 2015-05-20.
 */
define(function () {
    window.game = window.game || {};

    var AssetManager = function () {
        this.initialize();
    };

    var p = AssetManager.prototype = new createjs.EventDispatcher();

    p.EventDispatcher_initialize = p.initialize;

    //events
    p.ASSETS_PROGRESS = 'assets progress';
    p.ASSETS_COMPLETE = 'assets complete';

    //p.loadManifest = null;
    p.queue = null;
    p.loadProgress = 0;
    p.manifestQueue = [];
    p._timeSlice = null;

    // pool
    p.sprites    = [];
    p.spritePool = [];

    //spriteSheet
    p.spriteSheets={};

    //cached file list
    p.cachedFileURLList=[];

    //TODO: check LocalStorage resources versions
    p.initialize = function () {
        this.EventDispatcher_initialize();
        this.queue = this.initQueue();
    }
    p.initQueue = function() {

        createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin]);
        createjs.Sound.alternateExtensions = ["mp3", "ogg"];
        createjs.Sound.defaultInterruptBehaviour = createjs.Sound.INTERRUPT_LATE;

        //createjs.Sound.initializeDefaultPlugins();
        var que = new createjs.LoadQueue();
        que.maintainScriptOrder = true;
        que.installPlugin(createjs.Sound);
        que.on('progress',this.assetsProgress,this);
        que.on('complete',this.assetsLoaded,this);
        return que;
    }
    p.preloadAssets = function (loadManifest, loadDelay) {
        //        if(this.queue.progress){
        //            var que = this.initQueue();
        //            que.loadManifest(loadManifest, false);
        //            this.queue.next = que;
        //        } else {
        //            this.queue.loadManifest(loadManifest, true);
        //        }
        var manifest = this.cacheFileURL(loadManifest.slice(0));
        manifest.length == 0
            ? !loadDelay
            ? game.assetsMgr.dispatchEvent(game.assetsMgr.ASSETS_COMPLETE)
            : false
            : this.queue.loadManifest(manifest, !loadDelay);
    }
    p.cacheFileURL = function(loadManifest) {
        for(var i=loadManifest.length-1; i>=0;i--){
            if(this.isFileURLCached(loadManifest[i].src)){
                console.info("File cached:",loadManifest[i].src);
                loadManifest.splice(i,1);
            }
        }
        return loadManifest;
    }
    p.isFileURLCached = function(url) {
        var isCached = this.cachedFileURLList.indexOf(url)!==-1;
        if(!isCached){ this.cachedFileURLList.push(url);}
        return isCached;
    }
    p.assetsProgress = function (e) {
        this.loadProgress = e.progress;
        game.utils.debugLogText("Files -", (e.progress*100).toFixed(2)+"%");
        var event = new createjs.Event(this.ASSETS_PROGRESS);
        this.dispatchEvent(event);
    }
    p.assetsLoaded = function (e) {
        console.log("assetsLoaded");
        //this.progress = 0;
        //this.queue.close();
        var event = new createjs.Event(this.ASSETS_COMPLETE);
        this.dispatchEvent(event);
    }
    p.getAsset = function (asset) {
        return this.queue.getResult(asset);
    }
    p.buildSpriteSheet = function(gameState, callback, scope, data){
        if(this.checkSpriteSheetBuilt(gameState)) {                 // cache built spritesheet
            this.handleBuildCompleteCallback({fn:callback, scope: scope, data: data});
            return;
        }

        var mcData, builder, i, source, sourceRect;
        mcData = game.data[gameState].MovieClipsData;
        console.log("buildSpriteSheet");
        if(mcData && mcData.length) {
            if(!game.loadingScene && scope.addLoadingProgressBar)
                scope.addLoadingProgressBar();
        }
        builder = new createjs.SpriteSheetBuilder();
        builder.on("progress", this.handleBuildProgress, this);
        builder.on("complete", this.handleBuildComplete, this, true,{gameState: gameState, fn:callback, scope: scope, data: data, builder:builder});
        for(i=0; i<mcData.length; i++) {
            source = new mcData[i].source;
            if((sourceRect = mcData[i].srcRec)) {
                var b = {};
                b.x = sourceRect[0]===false ? source.nominalBounds.x : sourceRect[0];
                b.y = sourceRect[1]===false ? source.nominalBounds.x : sourceRect[1];
                b.w = sourceRect[2]===false ? source.nominalBounds.width  : sourceRect[2];
                b.h = sourceRect[3]===false ? source.nominalBounds.height : sourceRect[3];
                source.nominalBounds = (source._bounds || source.nominalBounds)
                    .initialize(b.x, b.y, b.w, b.h);
            }

            //TODO  nest a container to set sourceRect when generating a spritesheet.
            //new createjs.Container()
            if(source instanceof createjs.MovieClip) {
                builder.addMovieClip(source, null, mcData[i].scale, null, null, function(label, source, start, end){
                    //console.log('addMovieClip:', label, start, end);
                    return label;
                });
            } else if(source instanceof createjs.Container) {
                builder.addFrame(source, null, mcData[i].scale, function (a, b) {
                    //console.log(b.name);
                    b.builder._animations[b.name] = {frames:[b.builder._index], next:false};
                }, {name: mcData[i].name, builder:builder});
            }
            //mcData[i].source = null; //remove for GC
            //lib[mcData[i].name] = null;
        }
        builder.timeSlice = 0.8;
        if(mcData && mcData.length) {
            builder.buildAsync(0.90);   //CPU 90%
        }
    }
    p.handleBuildComplete = function(evt, data){
        console.log("SceneBuildComplete: ",data.gameState);
        game.utils.debugLogText("SceneBuildComplete: "+data.gameState);

        game.stage.removeChild(data.scope.loadingProgressBar);

        this.spriteSheets[data.gameState] = data.builder.spriteSheet;
        var o = game.data[data.gameState].SpritesNextAnimationData || {};
        for (var n in o) {
            if(this.spriteSheets[data.gameState].getAnimation(n))
                this.spriteSheets[data.gameState] .getAnimation(n).next = o[n];
        }
        this.handleBuildCompleteCallback(data);
    }
    p.handleBuildProgress = function(evt){
        //        debugger;
        var percentage = evt.progress;
        var bar = game.loadingScene;
        game.utils.debugLogText("-build",(percentage*100).toFixed(2)+"%");
        /*var mem = window.performance.memory;
         var usedSize = mem.usedJSHeapSize;
         var totalSize = mem.totalJSHeapSize;
         game.utils.debugLogText("used: "+usedSize +"  total: "+totalSize);*/
        if(!bar && game.main) bar = game.main.loadingProgressBar;
        if(bar) bar.update(percentage, percentage===1 ? "OK" : (percentage*100).toFixed(2)+"%");

        if(this._timeSlice) {
            if(!this._timeSliceBak) {       //backup default timeslice
                this._timeSliceBak = evt.currentTarget.timeSlice;
            }
            evt.currentTarget.timeSlice = this._timeSlice;
        }
        game.stage.update();
    }
    p.getSprite = function(label,gameState){
        //console.log("getSprite", label);
        var sprite = this.spritePool.length ? this.spritePool.pop() : new createjs.Sprite(this.spriteSheets[gameState]);
        sprite.gotoAndPlay(label);
        this.sprites.push(sprite);
        return sprite;
    }
    p.reclaimSprite = function(sprite) {                                             //回收再利用Sprites元素�?
        if(sprite instanceof c.Container){
            for(var n=sprite.children.length-1; n>=0;n--) {
                this.reclaimSprite(sprite.children[n]);
            }
        }
        // deactivates the sprite, and returns it to the object pool for future reuse.
        c.Tween.removeTweens(sprite);
        //        sprite.stop();
        sprite.scaleY = 1;
        var index = this.sprites.indexOf(sprite);
        if (index != -1) { this.sprites.splice(index, 1); }
        if (sprite.parent) { sprite.parent.removeChild(sprite); }
        //if (this.boxPool.length) { this.boxPool.length = 0; }
        // remove individual config
        //        sprite.name = undefined;
        //        sprite.group = undefined;
        //        sprite.listener = undefined;
        //        sprite.removeAllEventListeners();
        //        this.spritePool.push(sprite);                                                       //回收�?spritePool

        //        console.log("reclaimed: ", sprite.name, this.sprites.length);
        sprite = null;
    }
    p.getImage = function(sprite){
        //TODO
    }
    p.checkSpriteSheetBuilt = function(gameState) {
        return !!this.spriteSheets[gameState];
    }
    p.handleBuildCompleteCallback = function(data){
        data.fn.call(data.scope, data.data);
    }
    p.setProgressBarPosition = function(x, y) {
        //if(!x || !y) return;
        //TODO   setProgressBarPosition!!
        game.main.loadingProgressBar.x = x;
        game.main.loadingProgressBar.y = y;
    };
    /**
     * once you changed the timeslice, the timeslice will be changed permanent. so, remember to change again.
     *
     * @param timeslice
     */
    p.setTimeSlice = function(timeslice){
        this._timeSlice = timeslice;
    }
    p.restoreTimeSlice = function(){
        if(this._timeSliceBak){
            this.setTimeSlice(this._timeSliceBak);
        }
        this.setTimeSlice(0.9);
    };

    window.game.AssetManager = AssetManager;
});