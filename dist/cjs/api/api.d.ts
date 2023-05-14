import type { AxiosResponse, AxiosRequestConfig } from 'axios';
import Router from './router';
import type { Route } from './router';
export interface Post {
    id: string | null | undefined;
    title: string;
    content: string;
    author: string | null;
}
declare type AnyObject = any;
declare type RouteParameters = AnyObject;
declare type ControllerResponse = {
    status: number;
    data: AnyObject;
    headers?: AnyObject;
};
export declare type RestApiProps = {
    posts?: Post[];
};
export default class RestApi {
    protected router: Router;
    protected posts: {
        [_id: string]: Post;
    };
    protected user: string | null;
    protected request: AxiosRequestConfig;
    protected tokens: string[];
    protected refreshTokens: string[];
    constructor(props?: RestApiProps);
    reset(): void;
    clean(): void;
    handle(request: AxiosRequestConfig): Promise<AxiosResponse>;
    protected auth(): {
        status: number;
        data: unknown;
    };
    protected authRefresh(): {
        status: number;
        data: unknown;
    };
    protected readPost(parameters: RouteParameters): {
        status: number;
        data: unknown;
    };
    protected createPost(): {
        status: number;
        data: unknown;
    };
    protected readPosts(): {
        status: number;
        data: unknown;
    };
    protected updatePost(parameters: RouteParameters): {
        status: number;
        data: unknown;
    };
    protected deletePost(parameters: RouteParameters): {
        status: number;
        data: {
            error: string;
        };
    } | {
        status: number;
        data: null;
    };
    protected file(): {
        headers: {
            'Content-Disposition': string;
            'Content-Type': string;
        };
        status: number;
        data: string | Blob;
    };
    protected notFound(): {
        status: number;
        data: {
            error: string;
        };
    };
    protected accessDenied(message?: string): {
        status: number;
        data: {
            error: string;
        };
    };
    protected forbidden(): {
        status: number;
        data: {
            error: string;
        };
    };
    protected badRequest(message: string): {
        status: number;
        data: {
            error: string;
        };
    };
    protected ok(data: unknown): {
        status: number;
        data: unknown;
    };
    protected created(data: unknown): {
        status: number;
        data: unknown;
    };
    protected noContent(): {
        status: number;
        data: null;
    };
    protected send(res: ControllerResponse): Promise<AxiosResponse>;
    protected sendCancelledResponse(): Promise<never>;
    protected securizeRequest(request: AxiosRequestConfig, route: Route): {
        status: number;
        data: {
            error: string;
        };
    } | undefined;
    protected createToken(username: string, exp: string, isRefreshToken?: boolean): string;
    protected isTokenExpired(token: string): boolean;
}
export {};
