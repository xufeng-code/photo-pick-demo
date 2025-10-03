module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.status(200).json({ 
    message: "New test endpoint working!", 
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
};