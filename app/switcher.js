/**
 * Created by LUOWEN on 2015-05-24.
 */
define(function (require, exports, module) {

    var switcher = $(".switch input");

    switcher.on('init.bootstrapSwitch', function (event, state) {
        game.switcher.state = !!$(this).attr('checked');
    });
    switcher.on('switchChange.bootstrapSwitch', function (event, state) {
        game.switcher.state = $(this).bootstrapSwitch("state");
    });


    /*var switchers = $(".switch input");
    switchers.each(function(k,v){
        $(v).bootstrapSwitch();
    });*/

    module.exports = switcher;
});