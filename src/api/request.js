import { ensureDefaultLogin } from './auth';
import axios from 'axios';

// Same business-code and X-Token conventions as rosen-website-assets/src/api/request.js.
const request = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'https://beta.gorosen.xyz', timeout: 15000 });
request.interceptors.request.use(async config => {
  if (!config.skipAuth) config.headers.set('X-Token', await ensureDefaultLogin());
  return config;
});
request.interceptors.response.use(response => {
  const body = response.data;
  if (body?.code === 20000) return body;
  if (body?.code === 50018) localStorage.removeItem('xtoken');
  const error = new Error(body?.msg || '请求未成功，请稍后重试。');
  error.code = body?.code;
  throw error;
}, error => !axios.isAxiosError(error) ? Promise.reject(error) : Promise.reject(new Error(error.response?.data?.msg || (error.code === 'ECONNABORTED' ? '请求超时，请重试。' : '无法连接服务，请检查网络后重试。'))));
export default request;
