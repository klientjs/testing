export default [
  // Auth
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

  // Resources
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

  // File
  {
    url: '/file',
    method: 'GET',
    controller: 'file'
  }
];
