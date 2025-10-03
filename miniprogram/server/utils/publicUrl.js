/**
 * 公共URL工具函数
 * 用于生成文件的绝对HTTPS URL
 */

/**
 * 生成公共访问的绝对URL
 * @param {string} filePath - 文件路径，如 'files/preview/xxx.jpg'
 * @returns {string} 完整的HTTPS URL
 */
function toPublicUrl(filePath) {
  const publicBase = process.env.PUBLIC_BASE || process.env.BASE_URL || 'http://localhost:5000';
  
  // 确保filePath以/开头
  const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  
  // 确保publicBase不以/结尾
  const normalizedBase = publicBase.endsWith('/') ? publicBase.slice(0, -1) : publicBase;
  
  return `${normalizedBase}${normalizedPath}`;
}

/**
 * 生成文件的公共URL（针对uploads目录下的文件）
 * @param {string} type - 文件类型：'original', 'preview', 'thumb'
 * @param {string} filename - 文件名
 * @returns {string} 完整的HTTPS URL
 */
function generateFileUrl(type, filename) {
  return toPublicUrl(`uploads/${type}/${filename}`);
}

module.exports = {
  toPublicUrl,
  generateFileUrl
};