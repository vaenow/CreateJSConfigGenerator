/**
 * Created by LUOWEN on 2015-05-24.
 */
define(function (require, exports, module) {
    //window.game = window.game || {};

    var switcher = $(".switch input");

    /*switcher.on('init.bootstrapSwitch', function (event, state) {
        console.log('init.bootstrapSwitch')
        //game.switcher.state = !!$(this).attr('checked');
    });
    switcher.on('switchChange.bootstrapSwitch', function (event, state) {
        //game.switcher.state = $(this).bootstrapSwitch("state");
        game.switcher.state = state;
    });*/

    switcher.bootstrapSwitch();

    module.exports = {
        isGroup: function () {
            return switcher.bootstrapSwitch("state");
        }
    };
});