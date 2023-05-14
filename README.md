# Klient testing 

![badge-coverage](.github/badges/coverage.svg)

- [Introduction](#introduction)
- [Requirements](#requirements)
- [Installation](#installation)
- [MockAxiosWithRestApi](#mockaxioswithrestapi)

## Introduction

This repository purposes tools for testing [Klient library](https://github.com/klientjs/core) with [JEST](https://github.com/facebook/jest) to make test files more readable.


## Requirements

- [Node](https://github.com/nodejs/node) >= v12
- [Axios](https://github.com/axios/axios) >= v0.27.0


## Installation

Install testing package with your favorite package manager :

```shell
# With NPM
$ npm install --save-dev @klient/testing

# With YARN
$ yarn add --dev @klient/testing
```


## MockAxiosWithRestApi

Mock [Axios](https://github.com/axios/axios) with a fake Rest API described below.

```js
import axios from 'axios';
import { mockAxiosWithRestApi } from '@klient/testing';

//
// Mock Axios
//
jest.mock('axios');
const api = mockAxiosWithRestApi({
  // Optionally load Post resources data in API
  // posts: [
  //   {
  //     id: 'xxx',
  //     title: 'Title',
  //     content: 'Content',
  //     author: 'test'
  //   }
  // ]
});


//
// Start a test
//
test('example', async () => {
  let credentials = {};
  let postId = null;

  //
  // Get JWT token for protected routes
  //
  await axios
    .post('/auth', {
      username: 'test',
      password: 'test',
      // exp: '2h',         // Specify token duration
      // refreshExp: '3h'   // Specify refresh token duration
    })
    .then(response => {  
      console.log(response.data);
      // {
      //   "token": "...",
      //   "refresh_token": "..."
      // }

      credentials = response.data
    })
  ;


  //
  // Refresh JWT token with refresh token provided
  //
  await axios
    .post('/auth/refresh', { refresh_token: credentials.refresh_token })
    .then(response => {  
      console.log(response.data);
      // {
      //   "token": "...",
      //   "refresh_token": "..."
      // }

      credentials = response.data
    })
  ;


  //
  // Create a Post resource
  //
  // YOU MUST BE AUTHENTICATED WITH JWT TOKEN
  //
  await axios
    .post('/posts', { title: 'test', content: 'test' }, {
      headers: {
        Authorization: `Bearer ${credentials.token}`
      }
    })
    .then(response => {  
      console.log(response.data);
      // {
      //   "id": "2190428f-6785-41be-a4c6-e6ad7cd978de",
      //   "title": "test",
      //   "content": "test",
      //   "author": "test"
      // }

      postId = response.data.id;
    })
  ;


  //
  // Get Post resource collection
  //
  await axios
    .get('/posts')
    .then(response => {  
      console.log(response.data);
      // [
      //   {
      //     "id": "2190428f-6785-41be-a4c6-e6ad7cd978de",
      //     "title": "test",
      //     "content": "test",
      //     "author": "test"
      //   }
      // ]
    })
  ;


  //
  // Get Post resource item
  //
  await axios
    .get(`/posts/${postId}`)
    .then(response => {  
      console.log(response.data);
      // {
      //   "id": "2190428f-6785-41be-a4c6-e6ad7cd978de",
      //   "title": "test",
      //   "content": "test",
      //   "author": "test"
      // }
    })
  ;


  //
  // Update Post resource item
  //
  // YOU MUST BE AUTHENTICATED WITH JWT TOKEN FETCHED WITH THE SAME USERNAME AS POST AUTHOR
  //
  await axios
    .put(`/posts/${postId}`, { title: 'Test', content: 'Test' } {
      headers: {
        Authorization: `Bearer ${credentials.token}`
      }
    })
    .then(response => {  
      console.log(response.data);
      // {
      //   "id": "2190428f-6785-41be-a4c6-e6ad7cd978de",
      //   "title": "Test",
      //   "content": "Test",
      //   "author": "test"
      // }
    })
  ;


  //
  // Delete Post resource item
  //
  // YOU MUST BE AUTHENTICATED WITH JWT TOKEN FETCHED WITH THE SAME USERNAME AS POST AUTHOR
  //
  await axios
    .delete(`/posts/${postId}`, {
      headers: {
        Authorization: `Bearer ${credentials.token}`
      }
    })
  ;


  //
  // Not found
  //
  await axios
    .get('/unkown')
    .catch(e => {
      // Print 404
      console.log(e.response.status);
    })
  ;


  //
  // Reset API data
  //
  api.reset();
  await axios
    .get('/posts')
    .then(response => {
      console.log(e.response.data); // Print []
    })
  ;
});
```

**Notes**

  - The API will reject requests containing invalid token with 401 status code
  - The entrypoints whoses expect request body will return a 400 status code if invalid data are provided
