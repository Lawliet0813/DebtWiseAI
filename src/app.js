import http from 'node:http';
import config from './config.js';
import Database from './storage/database.js';
import Router from './http/router.js';
import createServices from './services/index.js';
import registerRoutes from './routes/index.js';

function createServer() {
  const db = new Database();
  const baseContext = { config, db };
  const services = createServices(baseContext);
  const routerContext = { ...baseContext, services };
  const router = new Router(routerContext);
  registerRoutes(router, routerContext);
  return http.createServer((req, res) => router.handle(req, res));
}

export {
  createServer,
};
