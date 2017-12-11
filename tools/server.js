/**
 * @file server for development
 * @author leon<ludafa@outlook.com>
 */

const Koa = require('koa');
const webpack = require('webpack');
const {devMiddleware} = require('koa-webpack-middleware');
const config = require('./webpack.dev');
const port = 9000;
const rewrite = require('koa-rewrite');
const routes = require('./routes');

let app = new Koa();

routes.forEach(({pattern, component}) => {
    app.use(rewrite(pattern, `${component.replace('src', '/output/template')}.html`));
});

app.use(devMiddleware(webpack(config), {

    // display no info to console (only warnings and errors)
    noInfo: false,

    // display nothing to the console
    quiet: false,

    // switch into lazy mode
    // that means no watching, but recompilation on every request
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
    headers: { "X-Custom-Header": "yes" },

    // options for formating the statistics
    stats: {
        colors: true
    }

}));

app.listen(port, () => console.log(`server: http://localhost:${port}`));
