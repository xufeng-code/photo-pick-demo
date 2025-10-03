// 简单的测试函数
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  if (req.method === "GET") {
    return res.status(200).json({ message: "Test API works!", method: req.method });
  }
  
  if (req.method === "POST") {
    return res.status(200).json({ message: "POST works!", body: req.body });
  }
  
  return res.status(405).json({ error: "Method not allowed" });
}