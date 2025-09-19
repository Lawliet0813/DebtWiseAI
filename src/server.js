import config from './config.js';
import { createServer } from './app.js';

const server = createServer();

server.listen(config.port, () => {
  console.log(`DebtWise AI API listening on port ${config.port}`);
});
