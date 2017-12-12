/**
 * @file webpack configuration for dev
 * @author leon<ludafa@outlook.com>
 */

const fs = require('fs');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const port = process.env.PORT || 9000;
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const webpack = require('webpack');
const glob = require('glob');
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');

const root = path.join(__dirname, '..');

const pages = glob.sync('src/**/index.atom').map(page => {
    let name = page.slice(4, -11).replace(/\//g, '-').toLowerCase();
    return {
        origin: page,
        path: path.join(root, page),
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
                                }
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
        new ExtractTextPlugin('[name].css'),
        new HtmlWebpackHarddiskPlugin({
            outputPath: 'output/template'
        }),
        ...pages.map(({name, origin}) => new HtmlWebpackPlugin({
            template: 'tools/template.js',
            filename: `${origin.slice(4).replace(/\.atom$/, '.template.php')}`,
            source: origin,
            chunks: [name],
            alwaysWriteToDisk: true
        }))
    ]
};
