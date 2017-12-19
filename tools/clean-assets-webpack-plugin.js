/**
 * @file 清理无用的 assets
 * @author leon<ludafa@outlook.com>
 */

const path = require('path');
const fs = require('fs');
const glob = require('glob');
const chalk = require('chalk');

function getChunkInfo(name) {
    let match = /([\w-]+)\.([a-z0-9]{8})\.(\w+)$/.exec(name);
    return match
        ? {
            chunkName: match[1],
            hash: match[2],
            ext: match[3]
        }
        : {};
}

class CleanAssetsPlugin {

    constructor(match) {
        this.match = match;
    }

    apply(compiler) {

        compiler.plugin('done', stats => {

            const outputPath = path.resolve(
                compiler.options.context,
                compiler.outputPath
            );

            const assets = stats.toJson().assets;

            const files = glob
                .sync(path.resolve(outputPath, '**/*'))
                .map(file => {
                    return Object.assign(
                        {
                            path: file,
                            relative: path.relative(outputPath, file)
                        },
                        getChunkInfo(path.basename(file))
                    );
                });

            const filesToDelete = files
                .filter(file => (
                    !assets.some(asset => asset.name === file.relative)
                    || !this.match(file)
                ));

            for (const file of filesToDelete) {
                fs.unlinkSync(file.path);
                console.log('Deleted ' + chalk.yellow(file.relative));
            }

        });
    }

}

module.exports = CleanAssetsPlugin;
