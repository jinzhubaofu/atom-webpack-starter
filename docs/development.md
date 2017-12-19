# 开发环境解决方案简介

本地开发环境基于一个 node server。

> node server 基于 express

## webpack 编译

### 1. 启动的同时开始 webpack 编译

这么做的原因是我们的 SSR 处理过程需要使用 webpack 的构建产物 `*.atom.php` 和 `*.template.php` 才能进行。

### 2. 入口 atom

1. 入口 atom 我们是依靠约定 `index.atom` 为入口来进行标识的，即所有的 `index.atom` 都是一个页面的入口；
2. 入口 atom 转化为 entry 的规则是：SomeCategory/SomePage => somecategory-somepage；
3. 入口的启动封装 EntryLoader

    atom 在 html 中启动需要额外配合 `common/index` 以及后端输出的数据才能启动。

    因此，我们给 `index.atom` 添加了一个特殊的 `EntryLoader`。`EntryLoader` 会把 *.atom 进行包裹，并用 `common/index` 启动它。

### 3. *.atom.php 的生成

*.atom.php 的产生是由 `atom-loader` 来完成的。

需要给 `atom-loader` 添加 `resolvePhpOutputPath` 来指定 php 的输出目录。

### 4. 页面入口模板的生成

页面入口模板是由 `webpack` 中的 `html-webpack-plugin` 生成的。

> 在开发环境下，`html-webpack-plugin` 还需要结合 `html-webpack-harddisk-plugin` 才能将生成的 php 写入磁盘

为每个页面都生成了一个定制版本的 php 文件。具体的，每个页面只包含每个页面需要的 chunk，即入口 atom 和 vendor。

另外，我们使用了 `html-webpack-plugin` 的 `template` 功能。 具体的，我们使用 `tools/template.js` 来完成生成的功能。它会根据 `tools/template.php` 的内容来生成定制版本的 php 文件。

> template.php 是 swig 格式的；
> 虽然是 swig 格式的，现在我们使用 swig 输出一些构建相关的数据在页面上。
> html-webpack-plugin 已经不在使用 inject 的功能，完全通过 template.js 和 swig 来注入合适的数据和 chunks

## php ssr 的处理

node server 对于本地路由配置中的请求 URL，请此类请求转发给 php-cgi 进行 SSR 预渲染处理。

其中，涉及到以下模块：

1. tools/routes.json 请求路径到页面入口 atom 组件

    当前示例中的 routes.json 如下：

    ```js
    [
        {
            "pattern": "/",
            "component": "Home/index"
        },
        {
            "pattern": "/post",
            "component": "Post/index"
        },
        {
            "pattern": "/my/info",
            "component": "My/Info/index"
        },
        {
            "pattern": "/my/like",
            "component": "My/Like/index"
        }
    ]
    ```
    当请求 `http://localhost:8080` 时路径 `/` 会被转给 `Home/index` 来处理。

2. node 到 php-cgi 的转发

    这里我们使用了 `tools/php-cgi` 模块完成此工作；

    > 注意，我们将所有的请求都转交给 `tools/server.php` (SCRIPT_FILE)来处理
    > `tools/server.php` 会根据请求路径和 `tools/routes` 来找到匹配的 `atom` 组件，并进行 SSR 处理

## 基于 webpack dynamic code splitting 的 spa 解决方案

本 repo 中采用了基于 webpack 通过 `import()` 语法来支持动态的 chunk 加载。

在 `src/index.js` 中的 `loadPage()` 函数可以看到具体的用法：

```js
let loadPage = (() => {

    let pages = {};

    return async (url, dehydratedData) => {

        try {

            let route = routes.find(({pattern}) => (pattern === url.pathname));

            if (!route) {
                throw error;
            }

            let {component, load, chunk} = route;

            let [page, data] = await Promise.all([
                pages[component] || import(`./${component}.atom`),
                dehydratedData && dehydratedData.data || await load(url)
            ]);

            pages[component] = page;

            render(
                page,
                data,
                Array.isArray(page.props) ? page.props : Object.keys(page.props)
            );

        }
        catch (e) {
            console.error(e);
        }

    };

})();
```

其中，最关键的一句就是这个：

```js
let [page, data] = await Promise.all([
    pages[component] || import(`./${component}.atom`),
    dehydratedData && dehydratedData.data || await load(url)
]);
```

首先，webpack 会根据 `import()` 的参数 `./${component}.atom` 来遍历 context 中符合路径模式的所有模块，把它们都生成一个 `chunk`，最后再编译为 `asset` 输出出来。

接下来我们遇到了几个问题：

1. webpack 会把不是页面入口的 atom 也生成为 chunk。

    这个问题我们通过 `tools/clean-assets-webpack-plugin` 把不是入口的 chunk 给删掉。

2. webpack 会生成 `import()` 来动态加载页面入口的 js chunk，但是 `extract-css-webpack-plugin` 不能为这种 chunk 生成独立的 css。

    这个问题我们使用 `extract-css-chunks-webpack-plugin` 来替换 `extract-css-webpack-plugin`。

3. 现在我们有了每个页面的入口 chunk(js + css)，但是在 `import()` 位置只会加载 js，而不会加载对应的 css。

    这个问题我们需要在 `import()` 编译时，将它转译成两段加载，即加载 js 和加载 css。

    这个功能我们通过引入 `babel-plugin-dual-import` 来完成。它可以做这样一个事情：

    ```js
    import('./Foo.js')

      ↓ ↓ ↓ ↓ ↓ ↓

    import importCss from 'babel-plugin-dual-import/importCss.js'

    Promise.all([
        import( /* webpackChunkName: 'Foo' */ './Foo'),
        importCss('Foo')
    ]).then(promises => promises[0]);
    ```

    这样我们拿到 js chunk 时，对应的 css 也完成了加载。

4. 接下来，又有一个问题：我们怎么知道页面入口 js chunk 的对应 css。

    由于我们的页面入口 chunk 是构建产物，对应的 css 也同样是构建产物。其中的 hash 会干扰我们对它们的定位。

    因此，我们在模板中需要输出页面入口 js 的 chunkName 与 css 之间的对应关系。这样在页面切换时，才能找到指定 chunk 的对应 css。

    这个功能我们是通过 `html-webpack-plugin` 生成 `*.template.php` 时解决的。

    我们会在页面上输出一个全局变量 `window.__CSS_CHUNKS`，作为 css 加载的配置表：

    ```html
    <script>
    window.__CSS_CHUNKS__ = {
        "Home/index.atom": "/Home-index-atom.css",
        "My/Info/index.atom": "/My-Info-index-atom.css",
        "My/Like/index.atom": "/My-Like-index-atom.css",
        "Post/index.atom": "/Post-index-atom.css"
    };
    </script>
    ```

    其中，这个配置表中的 key 是 js chunk 对应的模块名，value 是对应的 css 路径。

    最后，`importCss()` 会使用 `window.__CSS_CHUNKS__` 的配置加载 css。

5. 前端路由(history API)

    我们使用了一个简单的 history API 小工具 [numen](https://github.com/jinzhubaofu/numen)

    在使用这个架构时，需要注意 `<a>` 的跳转都需要阻止默认事件处理，通过 `locator.redirect` 来完成。

