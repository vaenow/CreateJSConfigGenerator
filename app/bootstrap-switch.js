/**
 * Created by LUOWEN on 2015-05-24.
 */
define(function (require, exports, module) {

    var switcher = $("[name='my-checkbox']");

    switcher.on('init.bootstrapSwitch', function (event, state) {
        console.log(this); // DOM element
        console.log(event); // jQuery event
        console.log(state); // true | false
    });
    switcher.on('switchChange.bootstrapSwitch', function (event, state) {
        console.log(this); // DOM element
        console.log(event); // jQuery event
        console.log(state); // true | false
    });

    switcher.bootstrapSwitch();

    module.exports = switcher;
});