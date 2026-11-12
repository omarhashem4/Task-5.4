import axios from 'axios'

// `withCredentials: true` makes the browser send the httpOnly auth cookie on
// every request to the API — including requests triggered by a different site.
// That convenience is exactly what leaves this app open to CSRF: there is no
// second proof that a state-changing request actually came from our own UI.
export const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  withCredentials: true
})
const safeMethods = new Set(['get', 'head', 'options']);
const preAuthPaths = new Set(['/auth/login', '/auth/register']);

let tokenRequest;

api.interceptors.request.use(async config => {
  if (
    safeMethods.has(config.method) ||
    (config.method === 'post' && preAuthPaths.has(config.url))
  ) {
    return config;
  }

  tokenRequest ??= api.get('/auth/csrf-token').finally(() => {
    tokenRequest = undefined;
  });

  const { data } = await tokenRequest;
  config.headers.set('X-CSRF-Token', data.csrfToken);
  return config;
});