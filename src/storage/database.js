import fs from 'node:fs';
import path from 'node:path';
import defaultData from './defaultData.js';

const DEFAULT_STORAGE_PATH = process.env.DEBTWISE_DB_FILE
  ? process.env.DEBTWISE_DB_FILE
  : path.join(process.env.VERCEL ? '/tmp' : process.cwd(), 'data', 'db.json');

function cloneDefaultData() {
  return JSON.parse(JSON.stringify(defaultData));
}

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
      fs.writeFileSync(this.filePath, JSON.stringify(cloneDefaultData(), null, 2));
    }
  }

  read() {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);
      const data = parsed && typeof parsed === 'object' ? parsed : {};
      const defaults = cloneDefaultData();
      return {
        ...defaults,
        ...data,
        users: Array.isArray(data.users) ? data.users : defaults.users,
        debts: Array.isArray(data.debts) ? data.debts : defaults.debts,
        payments: Array.isArray(data.payments) ? data.payments : defaults.payments,
        reminders: Array.isArray(data.reminders) ? data.reminders : defaults.reminders,
      };
    } catch (error) {
      return cloneDefaultData();
    }
  }

  write() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }
}

export default Database;
