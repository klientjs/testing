import axios from 'axios';
import RestApi from './api';

import type { RestApiProps } from './api';

export default function mockAxiosWithRestApi(props?: RestApiProps): RestApi {
  const api = new RestApi(props);

  (axios as unknown as jest.Mock).mockImplementation((req) => api.handle(req));
  (axios.request as jest.Mock).mockImplementation((req) => api.handle(req));
  (axios.get as jest.Mock).mockImplementation((url, config) => api.handle({ method: 'GET', url, ...config }));
  (axios.delete as jest.Mock).mockImplementation((url, config) => api.handle({ method: 'DELETE', url, ...config }));

  (axios.post as jest.Mock).mockImplementation((url, data, config) =>
    api.handle({ method: 'POST', url, data, ...config })
  );

  (axios.put as jest.Mock).mockImplementation((url, data, config) =>
    api.handle({ method: 'PUT', url, data, ...config })
  );

  (axios.patch as jest.Mock).mockImplementation((url, data, config) =>
    api.handle({ method: 'PATCH', url, data, ...config })
  );

  // eslint-disable-next-line no-underscore-dangle
  (axios.isCancel as jest.Mock).mockImplementation((value) => !!(value && value.__CANCEL__));

  return api;
}
