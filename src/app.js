import http from 'node:http';
import config from './config.js';
import Database from './storage/database.js';
import Router from './http/router.js';
import createServices from './services/index.js';
import registerRoutes from './routes/index.js';

function buildRouterContext() {
  const db = new Database();
  const baseContext = { config, db };
  const services = createServices(baseContext);
  return { ...baseContext, services };
}

function createRequestHandler() {
  const routerContext = buildRouterContext();
  const router = new Router(routerContext);
  registerRoutes(router, routerContext);
  return (req, res) => router.handle(req, res);
}

function createServer() {
  const handler = createRequestHandler();
  return http.createServer((req, res) => handler(req, res));
}

export {
  createServer,
  createRequestHandler,
};
