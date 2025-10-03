import { put } from '@vercel/blob';
import Busboy from 'busboy';
import { randomUUID } from 'crypto';

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许 POST 方法
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 检查环境变量
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ 
      error: 'BLOB_READ_WRITE_TOKEN environment variable is not set' 
    });
  }

  try {
    // 使用 busboy 解析 multipart/form-data
    const busboy = Busboy({ headers: req.headers });
    let fileBuffer = null;
    let fileName = null;
    let mimeType = null;

    // 监听文件字段
    busboy.on('file', (fieldname, file, info) => {
      if (fieldname !== 'file') {
        file.resume(); // 跳过非 'file' 字段
        return;
      }

      const { filename, mimeType: fileMimeType } = info;
      fileName = filename;
      mimeType = fileMimeType;

      // 验证文件类型
      if (!mimeType || !mimeType.startsWith('image/')) {
        file.resume();
        return res.status(400).json({ error: 'Only image files are allowed' });
      }

      // 收集文件数据
      const chunks = [];
      file.on('data', (chunk) => {
        chunks.push(chunk);
      });

      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    // 监听解析完成
    busboy.on('finish', async () => {
      if (!fileBuffer) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      try {
        // 生成唯一ID和文件名
        const id = randomUUID();
        const fileExtension = fileName ? fileName.split('.').pop() : 'jpg';
        const objectName = `${id}.${fileExtension}`;

        // 上传到 Vercel Blob
        const blob = await put(objectName, fileBuffer, {
          access: 'public',
          contentType: mimeType
        });

        // 返回结果（暂时所有URL都使用同一个）
        const response = {
          id,
          originalUrl: blob.url,
          previewUrl: blob.url,  // 暂时使用同一个URL
          thumbUrl: blob.url     // 暂时使用同一个URL
        };

        res.status(200).json(response);
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        res.status(500).json({ 
          error: 'Failed to upload file to blob storage',
          details: uploadError.message 
        });
      }
    });

    // 监听错误
    busboy.on('error', (error) => {
      console.error('Busboy error:', error);
      res.status(400).json({ error: 'Failed to parse multipart data' });
    });

    // 开始解析请求
    req.pipe(busboy);

  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}