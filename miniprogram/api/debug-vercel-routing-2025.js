export default function handler(req, res) {
  // 设置 CORS 和缓存控制头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 返回详细的调试信息
  const debugInfo = {
    success: true,
    message: 'Vercel API 路由调试端点正常工作',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query,
    vercelRegion: process.env.VERCEL_REGION || 'unknown',
    nodeVersion: process.version,
    platform: process.platform,
    environment: process.env.NODE_ENV || 'unknown'
  };

  res.status(200).json(debugInfo);
}