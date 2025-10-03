// utils/api.js
// 引入统一配置
const { getConfigManager } = require('./config');

// 获取配置管理器实例
const configManager = getConfigManager();

// API配置
const API_CONFIG = {
  BASE_URL: configManager.getConfig().BASE_URL,
  TIMEOUT: 30000
};