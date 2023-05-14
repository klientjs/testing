"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = [
    {
        url: '/auth',
        method: 'POST',
        controller: 'auth'
    },
    {
        url: '/auth/refresh',
        method: 'POST',
        controller: 'authRefresh'
    },
    {
        url: '/posts',
        method: 'POST',
        controller: 'createPost',
        protected: true
    },
    {
        url: '/posts',
        controller: 'readPosts'
    },
    {
        url: '/posts/{id}',
        controller: 'readPost'
    },
    {
        url: '/posts/{id}',
        method: 'PUT',
        controller: 'updatePost',
        protected: true
    },
    {
        url: '/posts/{id}',
        method: 'DELETE',
        controller: 'deletePost',
        protected: true
    },
    {
        url: '/file',
        method: 'GET',
        controller: 'file'
    }
];
