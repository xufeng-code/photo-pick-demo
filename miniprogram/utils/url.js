const { CONFIG } = require('./config.js');

// 调试CONFIG.API_BASE的值
console.log('🔧 URL工具加载，CONFIG.API_BASE:', CONFIG.API_BASE);
if (!CONFIG.API_BASE) {
  console.error('❌ CONFIG.API_BASE 未定义！请检查 utils/config.js');
}

/**
 * 规范化URL - 处理对象转字符串和相对路径转绝对路径
 * @param {string|object} url - URL字符串或包含url字段的对象
 * @returns {string} 规范化后的绝对HTTPS URL
 */
function normalizeUrl(url) {
  console.log('🔧 normalizeUrl 开始处理');
  console.log('🔧 输入参数:', url);
  console.log('🔧 输入类型:', typeof url);
  console.log('🔧 当前CONFIG:', CONFIG);
  console.log('🔧 CONFIG.API_BASE:', CONFIG ? CONFIG.API_BASE : 'CONFIG未定义');
  
  if (!url) {
    console.error('❌ normalizeUrl: URL为空或未定义');
    return '';
  }

  // 如果是对象，尝试提取URL字符串
  if (typeof url === 'object') {
    console.log('🔧 检测到对象类型URL，对象内容:', JSON.stringify(url, null, 2));
    if (url.url) {
      url = url.url;
      console.log('🔧 从对象中提取url字段:', url);
    } else if (url.href) {
      url = url.href;
      console.log('🔧 从对象中提取href字段:', url);
    } else {
      console.error('❌ 对象中没有找到url或href字段');
      console.error('❌ 对象所有属性:', Object.keys(url));
      return '';
    }
  }

  // 确保是字符串
  if (typeof url !== 'string') {
    console.error('❌ URL不是字符串类型:', typeof url, url);
    return '';
  }

  console.log('🔧 处理字符串URL:', url);

  // 如果已经是完整的HTTP/HTTPS URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    console.log('✅ 已是完整URL，直接返回:', url);
    return url;
  }

  // 如果是相对路径，添加API_BASE
  if (CONFIG && CONFIG.API_BASE) {
    const normalizedUrl = CONFIG.API_BASE + (url.startsWith('/') ? url : '/' + url);
    console.log('✅ 相对路径规范化完成:');
    console.log('   原始路径:', url);
    console.log('   API_BASE:', CONFIG.API_BASE);
    console.log('   最终URL:', normalizedUrl);
    return normalizedUrl;
  } else {
    console.error('❌ CONFIG.API_BASE 未定义，无法规范化相对路径');
    console.error('❌ CONFIG状态:', CONFIG);
    return url;
  }
}

/**
 * 安全获取字符串URL，用于错误处理
 * @param {any} url - 任意类型的URL
 * @returns {string} 安全的字符串URL
 */
function safeStringUrl(url) {
  const normalized = normalizeUrl(url);
  return normalized || String(url || '');
}

module.exports = {
  normalizeUrl,
  safeStringUrl
};