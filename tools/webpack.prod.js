/**
 * @file webpack configuration for dev
 * @author leon<ludafa@outlook.com>
 */

const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const glob = require('glob');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin');
const ExtractCssChunks = require('extract-css-chunks-webpack-plugin');
const atomStyleCompiler = require('./atom-style-compiler');
const atomScriptCompiler = require('./atom-script-compiler');
const ClosureCompilerPlugin = require('closure-webpack-plugin');

const port = process.env.PORT || 9000;
const root = path.join(__dirname, '..');
const pages = glob.sync('src/**/index.atom').map(page => {
    let origin = page.slice(4);
    let name = origin.slice(0, -11).replace(/\//g, '-');
    return {
        path: path.join(root, page),
        origin: origin,
        name: name,
        chunkName: origin.replace(/[\.\/]/g, '-')
    };
});

module.exports = {
    entry: {
        main: path.resolve('src/index.js')
    },
    output: {
        path: path.resolve('output/static'),
        filename: '[name].[chunkhash:8].js',
        chunkFilename: '[name].[chunkhash:8].js',
        umdNamedDefine: true,
        library: {
            root: 'main',
            amd: 'atom-webpack-starter/[name]'
        },
        libraryTarget: 'umd',
        publicPath: '/'
    },
    module: {
        rules: [
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
                                compileStyle: atomStyleCompiler
                            },
                            resolvePhpOutputPath(filePath) {
                                let outputFilePath = filePath
                                    .replace(root, '.')
                                    .replace('src', 'output/template');
                                return `${outputFilePath}.php`;
                            },
                            loaders: {
                                css: ExtractCssChunks.extract({
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
                loader: ExtractCssChunks.extract({
                    fallback: 'style-loader',
                    use: 'css-loader'
                })
            },
            {
                test: /\.js$/,
                use: 'babel-loader',
                exclude: /node_modules/
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
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            }
        }),
        new ExtractCssChunks('[name].[contenthash:8].css'),
        // new ClosureCompilerPlugin({mode: 'STANDARD'}),
        // 为每个页面创建一个 template php 模板
        ...pages.map(page => {

            let filename = path.join(
                __dirname,
                '../output/template',
                `${page.origin.replace(/\.atom$/, '.template.php')}`
            );

            return new HtmlWebpackPlugin({
                template: 'tools/template.js',
                filename: filename,
                alwaysWriteToDisk: true,
                page,
                pages
            });

        }),
        new OptimizeCSSPlugin({
            cssProcessorOptions: {
                safe: true
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            },
            sourceMap: false
        })
    ]
};
