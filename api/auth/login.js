import { createRequestHandler } from '../../src/app.js';

const handler = createRequestHandler();

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function loginHandler(req, res) {
  const originalUrl = req.url || '/';
  const queryIndex = originalUrl.indexOf('?');
  const search = queryIndex >= 0 ? originalUrl.slice(queryIndex) : '';
  const targetUrl = `/auth/login${search}`;

  try {
    req.url = targetUrl;
    await handler(req, res);
  } finally {
    req.url = originalUrl;
  }
}
