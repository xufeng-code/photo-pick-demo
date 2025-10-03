module.exports = (req, res) => {
  res.json({ message: "Hello from Vercel!", method: req.method, timestamp: new Date().toISOString() });
};