const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'zeta.db');

let db = null;
let SQL = null;

function save() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

class Statement {
  constructor(sql, params) {
    this.sql = sql;
    this.params = params || [];
  }

  get(...args) {
    const p = args.length > 0 ? args : this.params;
    const stmt = db.prepare(this.sql);
    if (p.length > 0) stmt.bind(p);
    const result = stmt.step() ? stmt.getAsObject() : undefined;
    stmt.free();
    return result;
  }

  all(...args) {
    const p = args.length > 0 ? args : this.params;
    const stmt = db.prepare(this.sql);
    if (p.length > 0) stmt.bind(p);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  run(...args) {
    const p = args.length > 0 ? args : this.params;
    const stmt = db.prepare(this.sql);
    if (p.length > 0) stmt.bind(p);
    try { stmt.step(); } catch (e) {}
    stmt.free();
    save();

    const lastId = db.exec("SELECT last_insert_rowid() as id");
    const lastInsertRowid = lastId.length > 0 ? lastId[0].values[0][0] : undefined;
    const changes = db.getRowsModified();

    return { lastInsertRowid, changes };
  }
}

const database = {
  prepare(sql, params) {
    return new Statement(sql, params);
  },

  exec(sql) {
    try { db.run(sql); } catch (e) { throw e; }
    save();
  }
};

async function init() {
  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    PRIMARY KEY (conversation_id, user_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    reply_to INTEGER DEFAULT NULL,
    type TEXT DEFAULT 'text',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS message_reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    emoji TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(message_id, user_id, emoji)
  )`);

  save();
}

database.ready = false;

init().then(() => {
  database.ready = true;
  console.log('Database initialized');
}).catch(err => {
  console.error('Database init error:', err);
  process.exit(1);
});

module.exports = database;
