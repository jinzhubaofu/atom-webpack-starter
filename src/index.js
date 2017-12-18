/**
 * @file main entry
 * @author leon <ludafa@outlook.com>
 */

import routes from './routes';
import Atom from 'vip-server-renderer/js/atom';

let render = (function () {

    let app = document.getElementById('app');
    let container = null;
    let vm;

    return (Component, data, props) => {

        if (vm) {
            vm.$destroy();
            vm.$el.parentNode.removeChild(vm.$el);
        }

        container = document.querySelector('[atom-root]');

        if (!container) {
            container = document.createElement('div');
            app.appendChild(container);
        }

        vm = new Atom({
            el: container,
            data: data,
            components: {
                app: Component
            },
            render(createElement) {
                return createElement('app', {
                    props: props.reduce(
                        (props, prop) => {
                            props[prop] = this[prop];
                            return props;
                        },
                        {}
                    )
                })
            }
        });

    };

})();


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
                import(`./${component}.atom`),
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


function bootstrap(data, props) {
    Array
        .from(document.querySelectorAll('#main-nav li>a'))
        .forEach(nav => nav.addEventListener('click', e => {
            e.preventDefault();
            loadPage(new URL(e.target.href));
        }));
    loadPage(new URL(location.href), {data, props});
}


bootstrap(window.__DATA__, window.__COMPONENT_PROPS__);
