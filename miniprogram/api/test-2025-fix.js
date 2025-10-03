// api/test-2025-fix.js
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') return res.status(204).end();

  return res.status(200).json({
    message: 'Vercel 配置修复测试成功！',
    timestamp: new Date().toISOString(),
    method: req.method,
    runtime: 'nodejs20.x',
    configFixed: true
  });
};