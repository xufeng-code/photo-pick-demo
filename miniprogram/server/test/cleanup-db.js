const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/app.db');
const db = new sqlite3.Database(dbPath);

console.log('🧹 开始清理测试数据...');

db.serialize(() => {
  // 清理测试相关的数据
  db.run('DELETE FROM photos WHERE session_id LIKE "test-%"', function(err) {
    if (err) {
      console.error('❌ 清理photos表失败:', err.message);
    } else {
      console.log(`✅ 清理photos表完成，删除了 ${this.changes} 条记录`);
    }
  });

  db.run('DELETE FROM ai_analyses WHERE session_id LIKE "test-%"', function(err) {
    if (err) {
      console.error('❌ 清理ai_analyses表失败:', err.message);
    } else {
      console.log(`✅ 清理ai_analyses表完成，删除了 ${this.changes} 条记录`);
    }
  });

  db.run('DELETE FROM shares WHERE session_id LIKE "test-%"', function(err) {
    if (err) {
      console.error('❌ 清理shares表失败:', err.message);
    } else {
      console.log(`✅ 清理shares表完成，删除了 ${this.changes} 条记录`);
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('❌ 关闭数据库失败:', err.message);
  } else {
    console.log('🎉 数据库清理完成！');
  }
});