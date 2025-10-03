module.exports = (req, res) => {
  // 设置明确的 JSON 响应头
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // 返回 JSON 响应
  res.status(200).json({ 
    success: true,
    message: "Unique endpoint working perfectly!", 
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: req.headers,
    vercel: true
  });
};