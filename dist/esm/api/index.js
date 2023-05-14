import axios from 'axios';
import RestApi from './api';
export default function mockAxiosWithRestApi(props) {
    const api = new RestApi(props);
    axios.mockImplementation((req) => api.handle(req));
    axios.request.mockImplementation((req) => api.handle(req));
    axios.get.mockImplementation((url, config) => api.handle(Object.assign({ method: 'GET', url }, config)));
    axios.delete.mockImplementation((url, config) => api.handle(Object.assign({ method: 'DELETE', url }, config)));
    axios.post.mockImplementation((url, data, config) => api.handle(Object.assign({ method: 'POST', url, data }, config)));
    axios.put.mockImplementation((url, data, config) => api.handle(Object.assign({ method: 'PUT', url, data }, config)));
    axios.patch.mockImplementation((url, data, config) => api.handle(Object.assign({ method: 'PATCH', url, data }, config)));
    axios.isCancel.mockImplementation((value) => !!(value && value.__CANCEL__));
    return api;
}
