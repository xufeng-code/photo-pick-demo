// api/ai/pick.js
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const body = req.body || {};
  const images = Array.isArray(body.images) ? body.images : [];
  if (!images.length) return res.status(400).json({ error: 'No images provided' });

  return res.status(200).json({
    sessionId: body.sessionId || null,
    bestId: images[0].id || 'photo_0',
    scores: images.map((img, i) => ({ id: img.id || `photo_${i}`, score: 90 - i * 5 }))
  });
};