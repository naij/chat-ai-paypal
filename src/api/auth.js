import md5 from 'md5';
import request from './request';

let loginPromise;
// Default account explicitly selected for this demo.
export function ensureDefaultLogin() {
  const token = localStorage.getItem('xtoken');
  if (token) return Promise.resolve(token);
  if (!loginPromise) {
    loginPromise = request.post('/api/open/member/auth', {
      mobile: 'wj@gorosen.xyz',
      password: md5('123456'),
      captcha: '2',
      lang: navigator.language?.split('-')[0] || 'en'
    }, { skipAuth: true }).then(({ data }) => {
      if (typeof data?.token !== 'string' || !data.token.trim()) throw new Error('登录接口未返回有效 token。');
      localStorage.setItem('xtoken', data.token);
      return data.token;
    }).finally(() => { loginPromise = undefined; });
  }
  return loginPromise;
}
