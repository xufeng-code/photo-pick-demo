const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class ImageProcessor {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../uploads');
    this.originalDir = path.join(this.uploadsDir, 'original');
    this.previewDir = path.join(this.uploadsDir, 'preview');
    this.thumbDir = path.join(this.uploadsDir, 'thumb');
  }

  // 初始化上传目录
  async initDirectories() {
    const dirs = [this.uploadsDir, this.originalDir, this.previewDir, this.thumbDir];
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  // 处理上传的图片
  async processImage(buffer, originalName) {
    try {
      await this.initDirectories();
      
      const fileKey = uuidv4();
      const ext = '.jpg'; // 统一使用 .jpg 扩展名
      
      // 基础 sharp 实例
      const baseImage = sharp(buffer).rotate(); // 自动根据EXIF旋转

      // 获取图片信息 (从基础实例中获取)
      const metadata = await baseImage.metadata();
      
      // 保存原图 (不去除元数据)
      const originalPath = path.join(this.originalDir, `${fileKey}${ext}`);
      await baseImage
        .jpeg({ quality: 95 }) // 高质量保存
        .toFile(originalPath);
      
      // 生成预览图 (最长边2048px)
      const previewPath = path.join(this.previewDir, `${fileKey}${ext}`);
      await baseImage
        .clone() // 克隆基础实例以进行新的处理
        .resize(2048, 2048, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .withMetadata(false) // 在生成衍生图时去除元数据
        .jpeg({ quality: 85 })
        .toFile(previewPath);
      
      // 生成缩略图 (最长边1024px)
      const thumbPath = path.join(this.thumbDir, `${fileKey}${ext}`);
      await baseImage
        .clone() // 再次克隆
        .resize(1024, 1024, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .withMetadata(false) // 去除元数据
        .jpeg({ quality: 80 })
        .toFile(thumbPath);
      
      // 获取文件大小
      const stats = await fs.stat(originalPath);
      
      return {
        fileKey,
        originalName,
        size: stats.size,
        width: metadata.width,
        height: metadata.height,
        paths: {
          original: `original/${fileKey}${ext}`,
          preview: `preview/${fileKey}${ext}`,
          thumb: `thumb/${fileKey}${ext}`
        }
      };
    } catch (error) {
      console.error('图片处理失败:', error);
      throw new Error('图片处理失败: ' + error.message);
    }
  }

  // 删除图片文件
  async deleteImage(fileKey, ext = '.jpg') {
    try {
      const files = [
        path.join(this.originalDir, `${fileKey}${ext}`),
        path.join(this.previewDir, `${fileKey}${ext}`),
        path.join(this.thumbDir, `${fileKey}${ext}`)
      ];
      
      for (const file of files) {
        try {
          await fs.unlink(file);
        } catch (err) {
          // 忽略文件不存在的错误
          if (err.code !== 'ENOENT') {
            console.error('删除文件失败:', file, err);
          }
        }
      }
    } catch (error) {
      console.error('删除图片失败:', error);
    }
  }

  // 检查文件是否存在
  async fileExists(filePath) {
    try {
      await fs.access(path.join(this.uploadsDir, filePath));
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = new ImageProcessor();