/**
 * @file create template to serve every entry with ssr support
 * @author leon<ludafa@outlook.com>
 */

const fs = require('fs');
const path = require('path');

module.exports = function ({htmlWebpackPlugin}) {
    return fs.readFileSync(path.resolve('tools/template.php'), 'utf8');
};
