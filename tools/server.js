/**
 * @file express server for development
 * @author leon<ludafa@outlook.com>
 */

const express = require('express');
const path = require('path');
const php = require('./php-cgi');
const webpackDevMiddleware = require('webpack-dev-middleware');
const config = require('./webpack.dev');
const webpack = require('webpack');

let app = express();
let compiler = webpack(config);

// 将配置的路由转到 php 处理
app.use((routes => {

    return php.cgi({
        match: ({pathname}) => {
            for (let {pattern, component} of routes) {
                if (pattern === pathname) {
                    return true;
                }
            }
        },
        index: path.join(__dirname, './server.php')
    });

})(require('./routes.json')));

app.use(webpackDevMiddleware(compiler, {

    // display no info to console (only warnings and errors)
    noInfo: false,

    // display nothing to the console
    quiet: false,

    // 直接关闭 lazy 模式，在启动时直接开始 watching，触发编译，生成每个页面的入口 php
    lazy: false,

    // watch options (only lazy: false)
    watchOptions: {
        aggregateTimeout: 300,
        poll: true
    },

    // public path to bind the middleware to
    // use the same as in webpack
    // publicPath: "/assets/",

    // custom headers
    headers: {
        'Access-Control-Allow-Origin': '*'
    },

    // options for formating the statistics
    stats: {
        colors: true
    }

}));

app.listen(8080, () => console.log('server up'));
