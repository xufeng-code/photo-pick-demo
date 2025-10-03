const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;

const DB_PATH = process.env.DB_PATH || './database/app.db';

let db = null;

// 获取数据库连接
function getDB() {
  if (!db) {
    throw new Error('数据库未初始化，请先调用 initDatabase()');
  }
  return db;
}

// 初始化数据库
async function initDatabase() {
  try {
    // 确保数据库目录存在
    const dbDir = path.dirname(DB_PATH);
    await fs.mkdir(dbDir, { recursive: true });

    // 创建数据库连接
    db = new sqlite3.Database(DB_PATH);

    // 创建表结构
    await createTables();
    
    console.log('数据库初始化成功:', DB_PATH);
    return db;
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

// 创建表结构
function createTables() {
  return new Promise((resolve, reject) => {
    const sql = `
      -- 图片文件表
      CREATE TABLE IF NOT EXISTS photos (
        id TEXT PRIMARY KEY,
        file_key TEXT NOT NULL UNIQUE,
        original_name TEXT NOT NULL,
        size INTEGER NOT NULL,
        width INTEGER,
        height INTEGER,
        original_path TEXT NOT NULL,
        preview_path TEXT NOT NULL,
        thumb_path TEXT NOT NULL,
        session_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 分享记录表
      CREATE TABLE IF NOT EXISTS shares (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        photo_id TEXT NOT NULL,
        title TEXT,
        description TEXT,
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (photo_id) REFERENCES photos (id)
      );

      -- 点赞记录表
      CREATE TABLE IF NOT EXISTS likes (
        id TEXT PRIMARY KEY,
        share_id TEXT NOT NULL,
        user_identifier TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(share_id, user_identifier),
        FOREIGN KEY (share_id) REFERENCES shares (id)
      );

      -- 评论表
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        share_id TEXT NOT NULL,
        content TEXT NOT NULL,
        author_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (share_id) REFERENCES shares (id)
      );

      -- AI分析记录表 (可选，用于缓存和统计)
      CREATE TABLE IF NOT EXISTS ai_analyses (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        photos_count INTEGER NOT NULL,
        best_photo_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        tags TEXT NOT NULL,
        scores TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 创建索引
      CREATE INDEX IF NOT EXISTS idx_photos_file_key ON photos(file_key);
      CREATE INDEX IF NOT EXISTS idx_photos_session_id ON photos(session_id);
      CREATE INDEX IF NOT EXISTS idx_shares_session_id ON shares(session_id);
      CREATE INDEX IF NOT EXISTS idx_shares_photo_id ON shares(photo_id);
      CREATE INDEX IF NOT EXISTS idx_likes_share_id ON likes(share_id);
      CREATE INDEX IF NOT EXISTS idx_comments_share_id ON comments(share_id);
      CREATE INDEX IF NOT EXISTS idx_ai_analyses_session ON ai_analyses(session_id);
    `;

    db.exec(sql, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// 执行查询
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// 执行单条查询
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// 执行插入/更新/删除
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ 
          lastID: this.lastID, 
          changes: this.changes 
        });
      }
    });
  });
}

// 关闭数据库连接
function closeDatabase() {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('关闭数据库失败:', err);
      } else {
        console.log('数据库连接已关闭');
      }
    });
    db = null;
  }
}

module.exports = {
  initDatabase,
  getDB,
  query,
  get,
  run,
  closeDatabase
};