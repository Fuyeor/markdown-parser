// @/api/index.ts
import { HttpClient } from '@fuyeor/commons';

const apiClient = new HttpClient({
  baseURL: '/',
  timeout: 10000,
});

export default apiClient;
