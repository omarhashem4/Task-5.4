import { createHmac } from 'node:crypto';
import { doubleCsrf } from 'csrf-csrf';

const secure = process.env.NODE_ENV === 'production';

export const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET ||
    createHmac('sha256', process.env.JWT_SECRET)
      .update('csrf-token-signing')
      .digest('hex'),
  getSessionIdentifier: req => req.cookies.token,
  cookieName: secure ? '__Host-csrf-token' : 'csrf-token',
  cookieOptions: { httpOnly: true, sameSite: 'strict', secure, path: '/' }
});