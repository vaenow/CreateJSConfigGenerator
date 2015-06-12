/**
 * Created by LUOWEN on 2015-05-21.
 */
// seajs 的简单配置
seajs.config({
    base: ".",
    alias: {
        "fairy": "lib/role_main_fairy.json"
    },
    // 文件编码
    charset: 'utf-8',
    // 调试模式
    debug: true
});

//初始化全局变量
window.game = {};

// 加载入口模块
seajs.use("./app/main");