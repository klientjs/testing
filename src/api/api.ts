/* eslint-disable class-methods-use-this */

import { AxiosError, CanceledError } from 'axios';
import { v4 as uuidV4 } from 'uuid';
import jwtDecode from 'jwt-decode';
import * as jwt from 'jsonwebtoken';

import type { AxiosResponse, AxiosRequestConfig } from 'axios';
import helper from './helper';
import Router from './router';
import routes from './routes';

import type { Route } from './router';

export interface Post {
  id: string | null | undefined;
  title: string;
  content: string;
  author: string | null;
}

type AnyObject = any; // eslint-disable-line
type RouteParameters = AnyObject;
type ControllerResponse = {
  status: number;
  data: AnyObject;
  headers?: AnyObject;
};

export type RestApiProps = {
  posts?: Post[];
};

export default class RestApi {
  protected router = new Router(routes);

  protected posts: { [_id: string]: Post } = {};

  protected user: string | null = null;

  protected request: AxiosRequestConfig = {};

  protected tokens: string[] = [];

  protected refreshTokens: string[] = [];

  constructor(props?: RestApiProps) {
    if (props?.posts) {
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

  handle(request: AxiosRequestConfig): Promise<AxiosResponse> {
    if (request.signal?.aborted) {
      return this.sendCancelledResponse();
    }

    const [route, parameters] = this.router.match(request);

    // Check request and auth user
    const failureResponse = this.securizeRequest(request, route);

    // Invalid request
    if (failureResponse) {
      return this.send(failureResponse);
    }

    // Update current request
    this.request = request;

    // Call method to get response
    const response = (this as AnyObject)[route.controller](parameters);

    // Send formatted response
    return this.send(response);
  }

  protected auth() {
    const { username, password, exp, refreshExp } = this.request.data;

    if (!username || !password) {
      return this.badRequest('Invalid credentials.');
    }

    return this.ok({
      token: this.createToken(username, exp || '1d'),
      refresh_token: this.createToken(username, refreshExp || '2d', true)
    });
  }

  protected authRefresh() {
    const refreshToken = this.request.data.refresh_token;

    if (!refreshToken || !this.refreshTokens.includes(refreshToken)) {
      return this.badRequest('Invalid refresh token provided.');
    }

    if (this.isTokenExpired(refreshToken)) {
      return this.badRequest('Expired refresh token provided.');
    }

    const { username }: { username: string } = jwtDecode(refreshToken);

    this.refreshTokens.splice(this.refreshTokens.indexOf(refreshToken), 1);

    return this.ok({
      token: this.createToken(username, '1d'),
      refresh_token: this.createToken(username, '2d', true)
    });
  }

  protected readPost(parameters: RouteParameters) {
    const post = this.posts[String(parameters.id)];

    if (!post) {
      return this.notFound();
    }

    return this.ok(post);
  }

  protected createPost() {
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

  protected readPosts() {
    const { title, content } = this.request.params || {};

    let collection: Post[] = Object.keys(this.posts).map((id) => this.posts[id]);

    if (title) {
      collection = collection.filter((post) => post.title.indexOf(title) !== -1);
    }

    if (content) {
      collection = collection.filter((post) => post.content.indexOf(content) !== -1);
    }

    return this.ok(collection);
  }

  protected updatePost(parameters: RouteParameters) {
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

  protected deletePost(parameters: RouteParameters) {
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

  protected file() {
    const content = 'Hello world !';
    let data: string | Blob = content;

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

  protected notFound() {
    return {
      status: 404,
      data: {
        error: 'Not Found.'
      }
    };
  }

  protected accessDenied(message?: string) {
    return {
      status: 401,
      data: {
        error: message || 'Access denied.'
      }
    };
  }

  protected forbidden() {
    return {
      status: 403,
      data: {
        error: 'Forbidden.'
      }
    };
  }

  protected badRequest(message: string) {
    return {
      status: 400,
      data: {
        error: message
      }
    };
  }

  protected ok(data: unknown) {
    return {
      status: 200,
      data
    };
  }

  protected created(data: unknown) {
    return {
      status: 201,
      data
    };
  }

  protected noContent() {
    return {
      status: 204,
      data: null
    };
  }

  protected send(res: ControllerResponse): Promise<AxiosResponse> {
    const response = {
      headers: {
        'Content-Type': 'application/json',
        ...res.headers
      },
      statusText: helper.getStatusText(res.status),
      config: this.request,
      ...res
    };

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

  protected sendCancelledResponse() {
    const err = new CanceledError();

    Object.defineProperty(err, '__CANCEL__', { value: true });
    err.code = AxiosError.ERR_CANCELED;
    err.config = this.request;

    return Promise.reject(err);
  }

  protected securizeRequest(request: AxiosRequestConfig, route: Route) {
    const raw = request.headers?.Authorization;
    const token = typeof raw === 'string' ? raw.replace('Bearer ', '') : null;

    if (!token && route.protected) {
      return this.accessDenied();
    }

    if (token) {
      if (!this.tokens.includes(token)) {
        return this.accessDenied('Invalid token provided.');
      }

      const data: { exp: number; username: string } = jwtDecode(token);

      if (data.exp <= Math.floor(Date.now() / 1000)) {
        return this.accessDenied('Expired token provided.');
      }

      this.user = data.username;
    }
  }

  protected createToken(username: string, exp: string, isRefreshToken = false) {
    const token = jwt.sign({ username }, 'secret', { expiresIn: exp });
    this[isRefreshToken ? 'refreshTokens' : 'tokens'].push(token);
    return token;
  }

  protected isTokenExpired(token: string) {
    const data: { exp: number; username: string } = jwtDecode(token);
    return data.exp <= Math.floor(Date.now() / 1000);
  }
}
