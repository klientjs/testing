import type { AxiosRequestConfig } from 'axios';

type AnyObject = { [_prop: string]: any }; // eslint-disable-line

export interface Route {
  url: string;
  controller: string;
  method?: string;
  protected?: boolean;
}

export default class Router {
  constructor(protected routes: Route[]) {}

  match(request: AxiosRequestConfig): [Route, unknown] {
    const requestUrl = request.url || '';
    const requestMethod = request.method || 'GET';

    let target: Route = { url: '*', controller: 'notFound' };
    let parameters: AnyObject = {};

    for (let i = 0, len = this.routes.length; i < len; i += 1) {
      const route = this.routes[i];
      const routeUrl = route.url;
      const routeMethod = route.method || 'GET';

      // Method doesn't match
      if (routeMethod !== requestMethod) {
        continue;
      }

      const routePaths = routeUrl.split('/').filter((v) => typeof v === 'string' && v !== '');
      const requestPaths = requestUrl.split('/').filter((v) => typeof v === 'string' && v !== '');

      // Url parts doesn't match
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
      } else {
        parameters = {};
      }
    }

    return [target, parameters];
  }
}
