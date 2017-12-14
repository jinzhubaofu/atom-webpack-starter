/**
 * @file atom scripts compiler
 * @author leon<ludafa@outlook.com>
 */

const babel = require('babel-core');
const fs = require('fs');
const path = require('path');
const options = JSON.parse(
    fs.readFileSync(
        path.join(__dirname, '../.babelrc'),
        'utf8'
    )
);

module.exports = code => babel.transform(code, options).code;
