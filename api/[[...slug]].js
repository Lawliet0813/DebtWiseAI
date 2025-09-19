import { createRequestHandler } from '../src/app.js';

const handler = createRequestHandler();

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function vercelHandler(req, res) {
  const originalUrl = req.url || '/';
  if (originalUrl.startsWith('/api')) {
    const nextUrl = originalUrl.slice(4) || '/';
    req.url = nextUrl.startsWith('/') ? nextUrl : `/${nextUrl}`;
  }

  try {
    await handler(req, res);
  } finally {
    req.url = originalUrl;
  }
}
