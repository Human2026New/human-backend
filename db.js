import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "human.db");
const schemaPath = path.join(__dirname, "schema.sql");

// Inicializa DB
const db = new sqlite3.Database(dbPath);

// Executa o schema automaticamente
db.serialize(() => {
  // Foreign keys ON
  db.run("PRAGMA foreign_keys = ON;");

  // Carrega schema.sql se existir
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, "utf8");
    const statements = schema.split(/;\s*$/m);

    statements.forEach((stmt) => {
      if (stmt.trim().length > 0) {
        db.run(stmt, (err) => {
          if (err) {
            console.error("❌ Erro ao aplicar schema:", err.message);
          }
        });
      }
    });

    console.log("📦 Database schema verificado");
  } else {
    console.warn("⚠️ schema.sql não encontrado");
  }
});

// Helpers PROMISE-BASED
export function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

export default db;
