"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const api_1 = require("./api");
function mockAxiosWithRestApi(props) {
    const api = new api_1.default(props);
    axios_1.default.mockImplementation((req) => api.handle(req));
    axios_1.default.request.mockImplementation((req) => api.handle(req));
    axios_1.default.get.mockImplementation((url, config) => api.handle(Object.assign({ method: 'GET', url }, config)));
    axios_1.default.delete.mockImplementation((url, config) => api.handle(Object.assign({ method: 'DELETE', url }, config)));
    axios_1.default.post.mockImplementation((url, data, config) => api.handle(Object.assign({ method: 'POST', url, data }, config)));
    axios_1.default.put.mockImplementation((url, data, config) => api.handle(Object.assign({ method: 'PUT', url, data }, config)));
    axios_1.default.patch.mockImplementation((url, data, config) => api.handle(Object.assign({ method: 'PATCH', url, data }, config)));
    axios_1.default.isCancel.mockImplementation((value) => !!(value && value.__CANCEL__));
    return api;
}
exports.default = mockAxiosWithRestApi;
