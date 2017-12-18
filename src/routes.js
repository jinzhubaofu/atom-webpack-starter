/**
 * @file routes configuration
 * @author leon<ludafa@outlook.com>
 */

let defaultLoader = async url => {
    let response = await fetch(url.pathname, {
        method: 'GET',
        headers: {
            accept: 'application/json'
        }
    });
    if (response.ok) {
        return await response.json();
    }
    throw new Error(`network failed, ${response.status}`);
};

export default [
    {
        "pattern": "/",
        "component": "Home/index",
        "load": defaultLoader,
        "chunk": "home"
    },
    {
        "pattern": "/post",
        "component": "Post/index",
        "load": defaultLoader,
        "chunk": "post"
    },
    {
        "pattern": "/my/info",
        "component": "My/Info/index",
        "load": defaultLoader,
        "chunk": "my-info"
    },
    {
        "pattern": "/my/like",
        "component": "My/Like/index",
        "load": defaultLoader,
        "chunk": "my-like"
    }
];
