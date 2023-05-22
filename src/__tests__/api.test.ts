/**
 * @jest-environment jsdom
 */

import axios from 'axios';
import jwtDecode from 'jwt-decode';

import { mockAxiosWithRestApi } from '..';
import RestApi from '../api/api';

let createdPostId: null | string = null;

let credentials = {
  token: '',
  refresh_token: ''
};

jest.mock('axios');

const username = 'user@localhost';
const api = mockAxiosWithRestApi({
  posts: [
    {
      id: 'xxx',
      title: 'Title',
      content: 'Content',
      author: username
    }
  ]
});

test('constructor', () => {
  expect(new RestApi()).toBeInstanceOf(RestApi);
});

test('login', () =>
  axios({
    url: '/auth',
    method: 'POST',
    data: {
      username,
      password: 'test',
      exp: '2h',
      refreshExp: '3h'
    }
  })
    .then(({ data, status }) => {
      expect(status).toBe(200);
      expect(data.token).toBeDefined();
      expect(data.refresh_token).toBeDefined();

      const tokenData: { username: string; exp: number } = jwtDecode(data.token);
      const refreshTokenData: { username: string; exp: number } = jwtDecode(data.refresh_token);

      expect(tokenData.username).toBe(username);
      expect(tokenData.exp).toBeGreaterThanOrEqual(Math.floor(Date.now() / 1000) + 7198);
      expect(tokenData.exp).toBeLessThanOrEqual(Math.floor(Date.now() / 1000) + 7200);

      expect(refreshTokenData.username).toBe(username);
      expect(refreshTokenData.exp).toBeGreaterThanOrEqual(Math.floor(Date.now() / 1000) + 10798);
      expect(refreshTokenData.exp).toBeLessThanOrEqual(Math.floor(Date.now() / 1000) + 10800);

      credentials = data;
    })
    .catch((e) => {
      console.log(e);
      throw e;
    }));

test('login:failure', () =>
  axios
    .post('/auth', { username })
    .then(() => {
      throw new Error('This request must failed');
    })
    .catch((e) => {
      expect(e.response.status).toBe(400);
    }));

test('login:refresh', () =>
  axios
    .request({
      url: '/auth/refresh',
      method: 'POST',
      data: {
        refresh_token: credentials.refresh_token
      }
    })
    .then(({ data, status }) => {
      expect(status).toBe(200);
      expect(data.token).toBeDefined();
      expect(data.refresh_token).toBeDefined();

      credentials = data;
    })
    .catch((e) => {
      console.log(e);
      throw e;
    }));

test('login:refresh:expired', async () => {
  let customCredentials = {
    token: '',
    refresh_token: ''
  };

  await axios
    .request({
      url: '/auth',
      method: 'POST',
      data: {
        username,
        password: 'test',
        exp: '0s',
        refreshExp: '0s'
      }
    })
    .then(({ data, status }) => {
      expect(status).toBe(200);
      expect(data.token).toBeDefined();
      expect(data.refresh_token).toBeDefined();

      customCredentials = data;
    })
    .catch((e) => {
      console.log(e);
      throw e;
    });

  await axios
    .request({
      url: '/auth/refresh',
      method: 'POST',
      data: {
        refresh_token: customCredentials.refresh_token
      }
    })
    .then(() => {
      throw new Error('This request must failed');
    })
    .catch((e) => {
      expect(e.response.status).toBe(400);
    });
});

test('login:refresh:failure', () =>
  axios
    .request({
      url: '/auth/refresh',
      method: 'POST',
      data: {
        refresh_token: 'unknown'
      }
    })
    .then(() => {
      throw new Error('This request must failed');
    })
    .catch((e) => {
      expect(e.response.status).toBe(400);
    }));

test('auth', () =>
  axios
    .request({
      url: '/posts',
      method: 'POST',
      data: {
        title: 'test',
        content: 'test'
      }
    })
    .then(() => {
      throw new Error('This request must failed');
    })
    .catch((e) => {
      expect(e.response.status).toBe(401);
      expect(e.response.data.error).toBe('Access denied.');
    }));

test('auth:invalid', async () => {
  await axios
    .get('/posts', {
      headers: {
        Authorization: 'Bearer FAKE'
      }
    })
    .then(() => {
      throw new Error('This request must failed');
    })
    .catch((e) => {
      expect(e.response.status).toBe(401);
    });
});

test('auth:expired', async () => {
  let customCredentials = {
    token: '',
    refresh_token: ''
  };

  await axios
    .request({
      url: '/auth',
      method: 'POST',
      data: {
        username,
        password: 'test',
        exp: '0s',
        refreshExp: '0s'
      }
    })
    .then(({ data, status }) => {
      expect(status).toBe(200);
      expect(data.token).toBeDefined();
      expect(data.refresh_token).toBeDefined();

      customCredentials = data;
    })
    .catch((e) => {
      console.log(e);
      throw e;
    });

  await axios
    .request({
      url: '/posts',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${customCredentials.token}`
      }
    })
    .then(() => {
      throw new Error('This request must failed');
    })
    .catch((e) => {
      expect(e.response.status).toBe(401);
    });
});

test('resource:create', () => {
  const requests: Promise<unknown>[] = [];

  requests.push(
    axios
      .request({
        url: '/posts',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${credentials.token}`
        },
        data: {
          title: 'Title created',
          content: 'Content created'
        }
      })
      .then(({ data, status }) => {
        expect(status).toBe(201);
        expect(data.id).toBeDefined();
        expect(data.title).toBe('Title created');
        expect(data.content).toBe('Content created');
        expect(data.author).toBe(username);

        createdPostId = data.id;
      })
      .catch((e) => {
        console.log(e);
        throw e;
      })
  );

  return Promise.all(requests);
});

test('resource:create:invalid', () =>
  axios
    .request({
      url: '/posts',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credentials.token}`
      },
      data: {
        title: 'test'
        // content: "test",
      }
    })
    .then(() => {
      throw new Error('This request must failed');
    })
    .catch((e) => {
      expect(e.response.status).toBe(400);
    }));

test('resource:read', () =>
  axios
    .request({
      url: `/posts/${createdPostId}`,
      method: 'GET'
    })
    .then(({ data, status }) => {
      expect(status).toBe(200);
      expect(data.id).toBe(createdPostId);
      expect(data.title).toBe('Title created');
      expect(data.content).toBe('Content created');
      expect(data.author).toBe(username);
    })
    .catch((e) => {
      console.log(e);
      throw e;
    }));

test('resource:read:collection', () =>
  axios
    .request({
      url: '/posts',
      method: 'GET'
    })
    .then(({ data, status }) => {
      expect(status).toBe(200);
      expect(data).toBeInstanceOf(Array);
      expect(data.length).toBe(2);

      expect(data[0].id).toBe('xxx');
      expect(data[0].title).toBe('Title');
      expect(data[0].content).toBe('Content');
      expect(data[0].author).toBe(username);

      expect(data[1].id).toBe(createdPostId);
      expect(data[1].title).toBe('Title created');
      expect(data[1].content).toBe('Content created');
      expect(data[1].author).toBe(username);
    })
    .catch((e) => {
      console.log(e);
      throw e;
    }));

test('resource:read:collection:filtered', () =>
  axios
    .request({
      url: '/posts',
      method: 'GET',
      params: {
        title: 'Title created',
        content: 'Content created'
      }
    })
    .then(({ data, status }) => {
      expect(status).toBe(200);
      expect(data).toBeInstanceOf(Array);
      expect(data.length).toBe(1);
      expect(data[0].title).toBe('Title created');
      expect(data[0].content).toBe('Content created');
    })
    .catch((e) => {
      console.log(e);
      throw e;
    }));

test('resource:update', () =>
  axios
    .put(
      `/posts/${createdPostId}`,
      {
        title: 'Title updated',
        content: 'Content updated'
      },
      {
        headers: {
          Authorization: `Bearer ${credentials.token}`
        }
      }
    )
    .then(({ data, status }) => {
      expect(status).toBe(200);
      expect(data.id).toBe(createdPostId);
      expect(data.title).toBe('Title updated');
      expect(data.content).toBe('Content updated');
      expect(data.author).toBe(username);
    })
    .catch((e) => {
      console.log(e);
      throw e;
    }));

test('resource:update:forbidden', async () => {
  let customCredentials = {
    token: ''
  };

  await axios
    .request({
      url: '/auth',
      method: 'POST',
      data: {
        username: 'unknow@localhost',
        password: 'unknow'
      }
    })
    .then(({ data }) => {
      customCredentials = data;
    });

  await axios
    .request({
      url: `/posts/${createdPostId}`,
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${customCredentials.token}`
      },
      data: {
        title: '...',
        content: '...'
      }
    })
    .then(() => {
      throw new Error('This request must failed');
    })
    .catch((e) => {
      expect(e.response.status).toBe(403);
    });
});

test('resource:delete:forbidden', async () => {
  let customCredentials = {
    token: ''
  };

  await axios
    .request({
      url: '/auth',
      method: 'POST',
      data: {
        username: 'unknow@localhost',
        password: 'unknow'
      }
    })
    .then(({ data }) => {
      customCredentials = data;
    });

  await axios
    .request({
      url: `/posts/${createdPostId}`,
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${customCredentials.token}`
      }
    })
    .then(() => {
      throw new Error('This request must failed');
    })
    .catch((e) => {
      expect(e.response.status).toBe(403);
    });
});

test('resource:delete', () =>
  axios
    .request({
      url: `/posts/${createdPostId}`,
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${credentials.token}`
      }
    })
    .then(({ data, status }) => {
      expect(status).toBe(204);
      expect(data).toBeNull();
    })
    .catch((e) => {
      console.log(e);
      throw e;
    }));

test('notfound', () => {
  axios
    .put(
      '/posts/unknown',
      {},
      {
        headers: {
          Authorization: `Bearer ${credentials.token}`
        }
      }
    )
    .then(() => {
      throw new Error('This request must failed');
    })
    .catch((e) => {
      expect(e.response.status).toBe(404);
    });

  axios
    .patch(
      '/posts/1',
      {},
      {
        headers: {
          Authorization: `Bearer ${credentials.token}`
        }
      }
    )
    .then(() => {
      throw new Error('This request must failed');
    })
    .catch((e) => {
      expect(e.response.status).toBe(404);
    });

  axios
    .delete('/posts/unknown', {
      headers: {
        Authorization: `Bearer ${credentials.token}`
      }
    })
    .then(() => {
      throw new Error('This request must failed');
    })
    .catch((e) => {
      expect(e.response.status).toBe(404);
    });

  axios
    .get('/posts/unknown')
    .then(() => {
      throw new Error('This request must failed');
    })
    .catch((e) => {
      expect(e.response.status).toBe(404);
    });

  axios({})
    .then(() => {
      throw new Error('This request must failed');
    })
    .catch((e) => {
      expect(e.response.status).toBe(404);
    });
});

test('reset', () => {
  api.reset();

  axios
    .request({
      url: '/posts'
    })
    .then(({ data }) => {
      expect(data).toBeInstanceOf(Array);
      expect(data.length).toBe(0);
    })
    .catch((e) => {
      console.log(e);
      throw e;
    });
});

test('cancel', () => {
  const controller = new AbortController();

  controller.abort();

  return axios
    .request({
      url: '/posts',
      signal: controller.signal
    })
    .then(() => {
      throw new Error('This request must failed');
    })
    .catch((e) => {
      expect(axios.isCancel(e)).toBe(true);
    });
});

test('file', () => {
  return axios
    .request({
      url: '/file',
      responseType: 'blob'
    })
    .then(({ headers, data, status }) => {
      expect(status).toBe(200);
      expect(data).toBeInstanceOf(Blob);
      expect(headers['Content-Type']).toBe('text/plain');
      expect(headers['Content-Disposition']).toBeDefined();
    })
    .catch((e) => {
      console.log(e);
      throw e;
    });
});
