import { URL } from 'node:url';
import AppError from '../errors/AppError.js';
import { sendJson, sendError } from '../utils/response.js';

function compilePath(path) {
  const keys = [];
  const pattern = path
    .split('/')
    .map((segment) => {
      if (segment.startsWith(':')) {
        keys.push(segment.slice(1));
        return '([^/]+)';
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  const regex = new RegExp(`^${pattern}$`);
  return { regex, keys };
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req
      .on('data', (chunk) => {
        chunks.push(chunk);
        if (chunks.reduce((sum, part) => sum + part.length, 0) > 1e6) {
          reject(new AppError(413, 'Request body is too large.'));
        }
      })
      .on('end', () => {
        if (chunks.length === 0) {
          resolve({});
          return;
        }
        try {
          const raw = Buffer.concat(chunks).toString('utf8');
          if (!raw) {
            resolve({});
            return;
          }
          const parsed = JSON.parse(raw);
          resolve(parsed);
        } catch (error) {
          reject(new AppError(400, 'Invalid JSON body.'));
        }
      })
      .on('error', (error) => reject(error));
  });
}

class Router {
  constructor(context) {
    this.context = context;
    this.routes = [];
  }

  register(method, path, options, handler) {
    let routeOptions = options;
    let routeHandler = handler;
    if (typeof options === 'function') {
      routeHandler = options;
      routeOptions = {};
    }
    const { regex, keys } = compilePath(path);
    this.routes.push({
      method: method.toUpperCase(),
      path,
      regex,
      keys,
      handler: routeHandler,
      options: { auth: true, ...routeOptions },
    });
  }

  get(path, options, handler) {
    this.register('GET', path, options, handler);
  }

  post(path, options, handler) {
    this.register('POST', path, options, handler);
  }

  patch(path, options, handler) {
    this.register('PATCH', path, options, handler);
  }

  delete(path, options, handler) {
    this.register('DELETE', path, options, handler);
  }

  async handle(req, res) {
    try {
      const method = req.method.toUpperCase();
      if (method === 'OPTIONS') {
        sendJson(res, 204);
        return;
      }
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const path = url.pathname.replace(/\/$/, '') || '/';
      const route = this.routes.find((item) => item.method === method && item.regex.test(path));
      if (!route) {
        sendJson(res, 404, { error: { message: 'Not Found' } });
        return;
      }
      const match = path.match(route.regex);
      const params = {};
      if (match) {
        route.keys.forEach((key, index) => {
          params[key] = decodeURIComponent(match[index + 1]);
        });
      }
      const query = Object.fromEntries(url.searchParams.entries());
      let body = {};
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        body = await parseBody(req);
      }
      const requestContext = {
        ...this.context,
        req,
        res,
        params,
        query,
        body,
        user: null,
      };
      if (route.options.auth) {
        const authorization = req.headers.authorization || req.headers.Authorization;
        const user = await this.context.services.auth.authenticate(authorization);
        requestContext.user = user;
      }
      const result = await route.handler(requestContext);
      if (!res.writableEnded) {
        if (result === undefined) {
          sendJson(res, 204);
          return;
        }
        if (typeof result === 'object' && result !== null && 'status' in result) {
          sendJson(res, result.status, result.body);
        } else {
          sendJson(res, 200, result);
        }
      }
    } catch (error) {
      sendError(res, error instanceof Error ? error : new Error('Unexpected error'));
    }
  }
}

export default Router;
