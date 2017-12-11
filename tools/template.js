/**
 * @file create template to serve every entry with ssr support
 * @author leon<ludafa@outlook.com>
 */

module.exports = async function ({htmlWebpackPlugin}) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return `<html>
<body>
<h2>files</h2>
<p><pre><code>\n${JSON.stringify(htmlWebpackPlugin.files, 0, 2)}</code></pre>\n</p>
<h2>options</h2>
<p><pre><code>\n${JSON.stringify(htmlWebpackPlugin.options, 0, 2)}</code></pre>\n</p>
<div [atom-root]></div>
</body>
</html>
`;
};
