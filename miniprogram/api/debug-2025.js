// 2025年调试端点 - 验证 serverless 函数是否正常工作
module.exports = async function handler(req, res) {
  // 设置响应头
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  
  // 处理 OPTIONS 请求
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  
  // 返回调试信息
  const debugInfo = {
    success: true,
    message: "🎉 Vercel Serverless 函数正常工作！",
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: req.headers,
    runtime: "nodejs20.x",
    environment: "vercel",
    version: "2025-debug",
    cache: "disabled"
  };
  
  return res.status(200).json(debugInfo);
}