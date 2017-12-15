/**
 * @file webpack configuration for dev
 * @author leon<ludafa@outlook.com>
 */

const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const glob = require('glob');

const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const AssetsPlugin = require('assets-webpack-plugin');

const atomStyleCompiler = require('./atom-style-compiler');
const atomScriptCompiler = require('./atom-script-compiler');

const port = process.env.PORT || 9000;
const root = path.join(__dirname, '..');
const pages = glob.sync('src/**/index.atom').map(page => {
    let name = page.slice(4, -11).replace(/\//g, '-').toLowerCase();
    return {
        origin: page,
        path: path.join(root, page),
        name: name
    };
});

const entries = pages.reduce((entries, page) => {
    entries[page.name] = page.path;
    return entries;
}, {
    bootstrap: [
        'vip-server-renderer/js/atom',
        path.resolve('src/common/index.js')
    ]
});

let chunkIndex = 0;

module.exports = {
    entry: entries,
    devtool: 'inline-source-map',
    output: {
        filename: '[name].js',
        chunkFilename: '[name].js',
        // umdNamedDefine: true,
        // library: {
        //     root: 'main',
        //     amd: 'atom-webpack-starter/[name]'
        // },
        // libraryTarget: 'umd',
        publicPath: '/'
    },
    module: {
        rules: [
            // {
            //     test: /index\.atom$/,
            //     use: [
            //         'babel-loader',
            //         path.resolve('tools/entry-loader.js')
            //     ]
            // },
            {
                test: /\.atom$/,
                use: [
                    {
                        loader: 'atom-loader',
                        options: {
                            compile: {
                                compileJSComponent(val, key) {
                                    return `require("${val}")`;
                                },
                                compilePHPComponent(val, key) {
                                    return ''
                                        + 'dirname(__FILE__) . "/" '
                                        + '. ' + JSON.stringify(val + '.php');
                                },
                                compileStyle: atomStyleCompiler,
                                compileJsScript: atomScriptCompiler
                            },
                            resolvePhpOutputPath(filePath) {
                                let outputFilePath = filePath
                                    .replace(root, '.')
                                    .replace('src', 'output/template');
                                return `${outputFilePath}.php`;
                            },
                            loaders: {
                                css: ExtractTextPlugin.extract({
                                    fallback: 'style-loader',
                                    use: 'css-loader'
                                })
                            }
                        }
                    }
                ]
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: 'css-loader'
                })
            },
            {
                test: /\.js$/,
                use: 'babel-loader',
                exclude: /node_modules|tools/
            },
            {
                test: /\.(eot|woff|ttf|woff2|svg|png|jpe?g|gif)$/,
                loader: 'file-loader'
            },
            {
                test: /\.html$/,
                use: 'html-loader'
            }
        ]
    },
    plugins: [
        new AssetsPlugin({
            prettyPrint: true
        }),
        new webpack.NamedChunksPlugin(),
        // new webpack.NamedModulesPlugin(),
        new webpack.WatchIgnorePlugin([
            '**/*.php'
        ]),
        // new webpack.optimize.CommonsChunkPlugin({
        //     names: ['vendor'],
        //     filename: '[name].js',
        //     minChunks: Infinity
        //     // module => (
        //     //     module.context && module.context.includes('node_modules')
        //     // )
        // }),
        new ExtractTextPlugin({
            filename: '[name].css'
            // allChunks: true
        }),
        new HtmlWebpackHarddiskPlugin({
            outputPath: 'output/template'
        }),
        // 为每个页面创建一个 template php 模板
        ...pages.map(({name, origin}) => new HtmlWebpackPlugin({
            template: 'tools/template.js',
            filename: `${origin.slice(4).replace(/\.atom$/, '.template.php')}`,
            chunks: ['bootstrap'],
            alwaysWriteToDisk: true,
            source: origin,
            name: name
        }))
    ]
};
