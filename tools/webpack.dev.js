/**
 * @file webpack configuration for dev
 * @author leon<ludafa@outlook.com>
 */

const {promisify} = require('util');
const fs = require('fs');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const port = process.env.PORT || 9000;
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const webpack = require('webpack');
const glob = promisify(require('glob'));
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');

let pages = glob.sync('src/**/index.atom').map(page => {
    let name = page.slice(4, -11).replace(/\//g, '-').toLowerCase();
    return {
        origin: page,
        path: path.join(__dirname, '..', page),
        name: name
    };
});


module.exports = {
    entry: pages.reduce((entries, page) => {
        entries[page.name] = [page.path, path.join(__dirname, '../src/common/index.js')];
        return entries;
    }, {}),
    devtool: 'inline-source-map',
    output: {
        path: path.join(__dirname, '../output/static'),
        publicPath: '/',
        filename: '[name].js',
        umdNamedDefine: true,
        library: {
            root: 'main',
            amd: 'atom-webpack-starter/[name]'
        },
        libraryTarget: 'umd'
    },
    module: {
        rules: [
            {
                test: /\.atom$/,
                use: [
                    'atom-loader'
                ]
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
                test: /\.php$/,
                use: [{
                    loader: path.resolve('tools/php-loader.js')
                }]
            },
            {
                test: /\.html$/,
                use: 'html-loader'
            }
        ]
    },
    plugins: [
        // new BundleAnalyzerPlugin(),
        new ExtractTextPlugin({
            filename: '[name].css',
            ignoreOrder: true
        }),
        ...pages.map(({name, origin}) => new HtmlWebpackPlugin({
            template: 'tools/template.js',
            filename: `${origin.replace('src', 'output/template')}.html`,
            source: origin,
            chunks: [name]
        }))
    ]
    // devServer: {
    //     headers: {
    //         'Access-Control-Allow-Origin': '*'
    //     },
    //     compress: true,
    //     historyApiFallback: true,
    //     port,
    //     hot: true,
    //     inline: true
    // }
};
