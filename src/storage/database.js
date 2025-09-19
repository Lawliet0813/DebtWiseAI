import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_DATA = {
  users: [],
  debts: [],
  payments: [],
  reminders: [],
};

const DEFAULT_STORAGE_PATH = process.env.DEBTWISE_DB_FILE
  ? process.env.DEBTWISE_DB_FILE
  : path.join(process.env.VERCEL ? '/tmp' : process.cwd(), 'data', 'db.json');

class Database {
  constructor(filePath = DEFAULT_STORAGE_PATH) {
    this.filePath = filePath;
    this.ensureStorage();
    this.data = this.read();
  }

  ensureStorage() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify(DEFAULT_DATA, null, 2));
    }
  }

  read() {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_DATA, ...parsed };
    } catch (error) {
      return { ...DEFAULT_DATA };
    }
  }

  write() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }
}

export default Database;
