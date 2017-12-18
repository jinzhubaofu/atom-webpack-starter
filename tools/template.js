/**
 * @file create template to serve every entry with ssr support
 * @author leon<ludafa@outlook.com>
 */

const fs = require('fs');
const path = require('path');
const swig = require('swig');
const template = swig.compile(
    fs.readFileSync(path.resolve('tools/template.php.swig'), 'utf8')
);

function getOutputPath(assetPath, config) {
    let publicPath = config && config.output && config.output.publicPath || '';
    return path.join(publicPath, assetPath);
}

module.exports = function ({htmlWebpackPlugin, webpack: stats, webpackConfig}) {

    let {
        page,
        pages
    } = htmlWebpackPlugin.options;

    let pageMap = pages.reduce(
        (map, page) => {
            map[page.chunkName] = page;
            return map;
        },
        {}
    );

    let cssChunks = Object
        .keys(stats.assetsByChunkName)
        .reduce(
            (cssChunks, chunkName) => {
                let page = pageMap[chunkName];
                if (page) {
                    let css = stats.assetsByChunkName[chunkName]
                        .filter(assetName => /\.css$/.test(assetName))
                        .map(assetName => getOutputPath(assetName, webpackConfig));
                    cssChunks[page.origin] = css.length ? css[0] : '';
                }
                return cssChunks;
            },
            {}
        );

    return template({
        stats,
        cssChunks,
        pages,
        page
    });

};
