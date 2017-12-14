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
const port = process.env.PORT || 8080;
const URL = require('url');
const fs = require('fs');

let app = express();
let compiler = webpack(config);

// 将配置的路由转到 php 处理
app.use((routes => {

    let match = ({pathname}) => routes.find(
        ({pattern}) => (pattern === pathname)
    );

    let phpMiddleware = php.cgi({
        match: match,
        index: path.join(__dirname, './server.php')
    });

    return async function (req, res, next) {

        let url = URL.parse(req.url);
        let route = match(url);

        if (!route) {
            next();
            return;
        }

        if (req.headers.accept !== 'application/json') {
            phpMiddleware.call(this, req, res, next);
            return;
        }

        let {component} = route;

        let mocker = path.join(__dirname, '../src', `${component}.mock.js`);

        if (!fs.existsSync(mocker)) {
            res.sendStatus(404);
            return;
        }

        try {

            let data = require(mocker);

            if (typeof data === 'function') {
                data = data(url);
            }

            if (data && typeof data.then === 'function') {
                data = await data;
            }

            res.json(data);

            return;
        }
        catch (e) {
            res.sendStatus(500);
        }

    };

})(require('./routes.json')));


if (process.env.NODE_ENV === 'dev') {
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
}
else {
    app.use(express.static(path.join(__dirname, '../output/static')));
}

app.listen(port, () => {
    console.log(
        process.env.NODE_ENV === 'dev'
            ? `wait for webpack to compile, http://localhost:${port}`
            : `server up: http://localhost:${port}`
    );
});
