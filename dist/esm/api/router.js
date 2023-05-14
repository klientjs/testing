export default class Router {
    constructor(routes) {
        this.routes = routes;
    }
    match(request) {
        const requestUrl = request.url || '';
        const requestMethod = request.method || 'GET';
        let target = { url: '*', controller: 'notFound' };
        let parameters = {};
        for (let i = 0, len = this.routes.length; i < len; i += 1) {
            const route = this.routes[i];
            const routeUrl = route.url;
            const routeMethod = route.method || 'GET';
            if (routeMethod !== requestMethod) {
                continue;
            }
            const routePaths = routeUrl.split('/').filter((v) => typeof v === 'string' && v !== '');
            const requestPaths = requestUrl.split('/').filter((v) => typeof v === 'string' && v !== '');
            if (routePaths.length !== requestPaths.length) {
                continue;
            }
            let match = false;
            for (let n = 0, rlen = routePaths.length; n < rlen; n += 1) {
                const routePath = routePaths[n];
                const requestPath = requestPaths[n];
                if (routePath === requestPath) {
                    match = n === rlen - 1;
                    continue;
                }
                if (routePath.indexOf('{') === 0 && requestPath !== undefined) {
                    const paramName = String(routePath).replace('{', '').replace('}', '');
                    parameters[paramName] = requestPath;
                    match = n === rlen - 1;
                }
            }
            if (match) {
                target = route;
                break;
            }
            else {
                parameters = {};
            }
        }
        return [target, parameters];
    }
}
