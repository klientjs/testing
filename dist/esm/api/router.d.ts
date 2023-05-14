import type { AxiosRequestConfig } from 'axios';
export interface Route {
    url: string;
    controller: string;
    method?: string;
    protected?: boolean;
}
export default class Router {
    protected routes: Route[];
    constructor(routes: Route[]);
    match(request: AxiosRequestConfig): [Route, unknown];
}
