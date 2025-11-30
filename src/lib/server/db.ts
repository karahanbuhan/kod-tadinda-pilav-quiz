import Database from "better-sqlite3";
import fs from "node:fs"; // Klasör kontrolü için

// Docker içinde 'data' klasörüne, localde ana dizine
const dbPath =
  process.env.NODE_ENV === "production" ? "data/quiz_app.db" : "quiz_app.db";

// Eğer production'da isek ve data klasörü yoksa oluştur (Hata almamak için)
if (process.env.NODE_ENV === "production" && !fs.existsSync("data")) {
  fs.mkdirSync("data");
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS winners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    code TEXT UNIQUE,
    score INTEGER,
    prize TEXT, -- 'BIG', 'SMALL', 'NONE'
    claimed INTEGER DEFAULT 0, -- 0: Hayır, 1: Evet
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export const DB = {
  add: (name: string, code: string, score: number, prize: string) => {
    const stmt = db.prepare(
      "INSERT INTO winners (name, code, score, prize) VALUES (?, ?, ?, ?)"
    );
    stmt.run(name, code, score, prize);
  },

  get: (code: string) => {
    const stmt = db.prepare("SELECT * FROM winners WHERE code = ?");
    return stmt.get(code) as any;
  },

  markClaimed: (code: string) => {
    const stmt = db.prepare("UPDATE winners SET claimed = 1 WHERE code = ?");
    stmt.run(code);
  },

  getAll: () => {
    return db
      .prepare("SELECT * FROM winners ORDER BY created_at DESC LIMIT 50")
      .all();
  },
};
