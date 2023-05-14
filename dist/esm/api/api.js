import { AxiosError, CanceledError } from 'axios';
import { v4 as uuidV4 } from 'uuid';
import jwtDecode from 'jwt-decode';
import * as jwt from 'jsonwebtoken';
import helper from './helper';
import Router from './router';
import routes from './routes';
export default class RestApi {
    constructor(props) {
        this.router = new Router(routes);
        this.posts = {};
        this.user = null;
        this.request = {};
        this.tokens = [];
        this.refreshTokens = [];
        if (props === null || props === void 0 ? void 0 : props.posts) {
            props.posts.forEach((post) => {
                this.posts[String(post.id)] = post;
            });
        }
    }
    reset() {
        this.clean();
        this.tokens = [];
        this.refreshTokens = [];
        this.posts = {};
    }
    clean() {
        this.user = null;
        this.request = {};
    }
    handle(request) {
        var _a;
        if ((_a = request.signal) === null || _a === void 0 ? void 0 : _a.aborted) {
            return this.sendCancelledResponse();
        }
        const [route, parameters] = this.router.match(request);
        const failureResponse = this.securizeRequest(request, route);
        if (failureResponse) {
            return this.send(failureResponse);
        }
        this.request = request;
        const response = this[route.controller](parameters);
        return this.send(response);
    }
    auth() {
        const { username, password, exp, refreshExp } = this.request.data;
        if (!username || !password) {
            return this.badRequest('Invalid credentials.');
        }
        return this.ok({
            token: this.createToken(username, exp || '1d'),
            refresh_token: this.createToken(username, refreshExp || '2d', true)
        });
    }
    authRefresh() {
        const refreshToken = this.request.data.refresh_token;
        if (!refreshToken || !this.refreshTokens.includes(refreshToken)) {
            return this.badRequest('Invalid refresh token provided.');
        }
        if (this.isTokenExpired(refreshToken)) {
            return this.badRequest('Expired refresh token provided.');
        }
        const { username } = jwtDecode(refreshToken);
        this.refreshTokens.splice(this.refreshTokens.indexOf(refreshToken), 1);
        return this.ok({
            token: this.createToken(username, '1d'),
            refresh_token: this.createToken(username, '2d', true)
        });
    }
    readPost(parameters) {
        const post = this.posts[String(parameters.id)];
        if (!post) {
            return this.notFound();
        }
        return this.ok(post);
    }
    createPost() {
        const { data } = this.request;
        const required = ['title', 'content'];
        for (let i = 0, len = required.length; i < len; i += 1) {
            if (!data || typeof data[required[i]] !== 'string') {
                return this.badRequest(`A string value is required for "${required[i]}" property`);
            }
        }
        const post = {
            id: uuidV4(),
            title: data.title,
            content: data.content,
            author: this.user
        };
        this.posts[post.id] = post;
        return this.created(post);
    }
    readPosts() {
        const { title, content } = this.request.params || {};
        let collection = Object.keys(this.posts).map((id) => this.posts[id]);
        if (title) {
            collection = collection.filter((post) => post.title.indexOf(title) !== -1);
        }
        if (content) {
            collection = collection.filter((post) => post.content.indexOf(content) !== -1);
        }
        return this.ok(collection);
    }
    updatePost(parameters) {
        const post = this.posts[String(parameters.id)];
        if (!post) {
            return this.notFound();
        }
        if (post.author !== this.user) {
            return this.forbidden();
        }
        const { data } = this.request;
        if (data && typeof data.title === 'string') {
            post.title = data.title;
        }
        if (data && typeof data.content === 'string') {
            post.content = data.content;
        }
        return this.ok(post);
    }
    deletePost(parameters) {
        const post = this.posts[String(parameters.id)];
        if (!post) {
            return this.notFound();
        }
        if (post.author !== this.user) {
            return this.forbidden();
        }
        delete this.posts[String(post.id)];
        return this.noContent();
    }
    file() {
        const content = 'Hello world !';
        let data = content;
        if (this.request.responseType === 'blob') {
            data = new Blob([content], { type: 'text/plain' });
        }
        return {
            headers: {
                'Content-Disposition': 'attachment;filename=hello.txt',
                'Content-Type': 'text/plain'
            },
            status: 200,
            data
        };
    }
    notFound() {
        return {
            status: 404,
            data: {
                error: 'Not Found.'
            }
        };
    }
    accessDenied(message) {
        return {
            status: 401,
            data: {
                error: message || 'Access denied.'
            }
        };
    }
    forbidden() {
        return {
            status: 403,
            data: {
                error: 'Forbidden.'
            }
        };
    }
    badRequest(message) {
        return {
            status: 400,
            data: {
                error: message
            }
        };
    }
    ok(data) {
        return {
            status: 200,
            data
        };
    }
    created(data) {
        return {
            status: 201,
            data
        };
    }
    noContent() {
        return {
            status: 204,
            data: null
        };
    }
    send(res) {
        const response = Object.assign({ headers: Object.assign({ 'Content-Type': 'application/json' }, res.headers), statusText: helper.getStatusText(res.status), config: this.request }, res);
        this.clean();
        if (response.status >= 200 && response.status < 400) {
            return Promise.resolve(response);
        }
        const err = new AxiosError();
        err.message = response.statusText;
        err.code = AxiosError.ERR_BAD_RESPONSE;
        err.config = this.request;
        err.response = response;
        return Promise.reject(err);
    }
    sendCancelledResponse() {
        const err = new CanceledError();
        Object.defineProperty(err, '__CANCEL__', { value: true });
        err.code = AxiosError.ERR_CANCELED;
        err.config = this.request;
        return Promise.reject(err);
    }
    securizeRequest(request, route) {
        var _a;
        const raw = (_a = request.headers) === null || _a === void 0 ? void 0 : _a.Authorization;
        const token = typeof raw === 'string' ? raw.replace('Bearer ', '') : null;
        if (!token && route.protected) {
            return this.accessDenied();
        }
        if (token) {
            if (!this.tokens.includes(token)) {
                return this.accessDenied('Invalid token provided.');
            }
            const data = jwtDecode(token);
            if (data.exp <= Math.floor(Date.now() / 1000)) {
                return this.accessDenied('Expired token provided.');
            }
            this.user = data.username;
        }
    }
    createToken(username, exp, isRefreshToken = false) {
        const token = jwt.sign({ username }, 'secret', { expiresIn: exp });
        this[isRefreshToken ? 'refreshTokens' : 'tokens'].push(token);
        return token;
    }
    isTokenExpired(token) {
        const data = jwtDecode(token);
        return data.exp <= Math.floor(Date.now() / 1000);
    }
}
