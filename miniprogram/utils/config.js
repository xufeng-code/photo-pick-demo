// utils/config.js
/**
 * 统一配置管理系统 - 可持续版本
 * 解决配置分散、不一致、缺乏验证等问题
 */

// 环境配置 - 单一数据源
const ENV_CONFIG = {
  development: {
    BASE_URL: 'http://localhost:5000',
    DEBUG: true
  },
  staging: {
    BASE_URL: 'https://photo-pick-demo1.vercel.app',
    DEBUG: true
  },
  production: {
    BASE_URL: 'https://photo-pick-demo1.vercel.app',
    DEBUG: false
  },
  h5_demo: {
    BASE_URL: 'https://xuanzhaopian-ai.vercel.app',
    DEBUG: true
  }
};

/**
 * 配置验证器
 */
class ConfigValidator {
  static validateUrl(url, name = 'URL') {
    if (!url) {
      throw new Error(`${name} 不能为空`);
    }
    
    if (typeof url !== 'string') {
      throw new Error(`${name} 必须是字符串`);
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error(`${name} 必须以 http:// 或 https:// 开头`);
    }
    
    try {
      // 小程序环境兼容性处理
      if (typeof URL !== 'undefined') {
        new URL(url);
      } else {
        // 简单的 URL 格式验证（小程序环境）
        const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
        if (!urlPattern.test(url)) {
          throw new Error('URL 格式无效');
        }
      }
    } catch (error) {
      throw new Error(`${name} 格式无效: ${error.message}`);
    }
    
    return true;
  }
  
  static validateConfig(config) {
    if (!config) {
      throw new Error('配置对象不能为空');
    }
    
    this.validateUrl(config.BASE_URL, 'BASE_URL');
    
    // 验证小程序环境要求
    if (!config.BASE_URL.startsWith('https://')) {
      console.warn('⚠️ 警告: 小程序要求使用HTTPS，当前配置可能无法正常工作');
    }
    
    return true;
  }
}

/**
 * 环境检测器 - 更可靠的环境检测
 */
class EnvironmentDetector {
  static detectEnvironment() {
    try {
      // 1. 检查是否在微信小程序环境
      if (typeof wx === 'undefined') {
        console.log('🔍 非微信小程序环境，使用生产配置');
        return 'production';
      }
      
      // 2. 尝试获取小程序账户信息
      try {
        const accountInfo = wx.getAccountInfoSync();
        if (accountInfo && accountInfo.miniProgram) {
          const envVersion = accountInfo.miniProgram.envVersion;
          console.log('🔍 检测到小程序环境版本:', envVersion);
          
          switch (envVersion) {
            case 'develop':
              return 'development';
            case 'trial':
              return 'staging';
            case 'release':
              return 'production';
            default:
              console.warn('⚠️ 未知的小程序环境版本:', envVersion);
              return 'production';
          }
        }
      } catch (error) {
        console.warn('⚠️ 获取小程序账户信息失败:', error.message);
      }
      
      // 3. 默认使用生产环境
      console.log('🔍 无法确定环境，使用生产配置');
      return 'production';
      
    } catch (error) {
      console.error('❌ 环境检测失败:', error.message);
      return 'production';
    }
  }
}

/**
 * 配置管理器 - 统一配置管理
 */
class ConfigManager {
  constructor() {
    this.currentEnv = null;
    this.currentConfig = null;
    this.isInitialized = false;
    
    this.initialize();
  }
  
  initialize() {
    try {
      // 1. 检测环境
      this.currentEnv = EnvironmentDetector.detectEnvironment();
      
      // 2. 获取环境配置
      const envConfig = ENV_CONFIG[this.currentEnv];
      if (!envConfig) {
        throw new Error(`未找到环境 ${this.currentEnv} 的配置`);
      }
      
      // 2.5. 检测是否为开发者工具，真机一律走HTTPS域名
      let finalBaseUrl = envConfig.BASE_URL;
      try {
        // 检测是否在开发者工具中
        const isDevtools = typeof __wxConfig !== 'undefined' && __wxConfig && __wxConfig.platform === 'devtools';
        
        if (isDevtools) {
          // 开发者工具可以使用localhost
          finalBaseUrl = 'http://localhost:5000';
          console.log('🔧 检测到开发者工具，使用本地服务器');
        } else {
          // 真机/体验版/线上版本强制使用HTTPS
          finalBaseUrl = 'https://photo-pick-demo1.vercel.app';
          console.log('📱 检测到真机/体验版，使用HTTPS域名');
        }
      } catch (error) {
        // 如果检测失败，默认使用HTTPS域名确保安全
        finalBaseUrl = 'https://photo-pick-demo1.vercel.app';
        console.log('⚠️ 环境检测失败，默认使用HTTPS域名');
      }
      
      // 3. 创建统一配置对象
      this.currentConfig = {
        // 统一使用 BASE_URL，避免 API_BASE 混乱
        BASE_URL: finalBaseUrl,
        API_BASE: finalBaseUrl,  // 保持向后兼容
        DEBUG: envConfig.DEBUG,
        ENVIRONMENT: this.currentEnv,
        INITIALIZED_AT: new Date().toISOString()
      };
      
      // 4. 验证配置
      ConfigValidator.validateConfig(this.currentConfig);
      
      // 5. 标记初始化完成
      this.isInitialized = true;
      
      // 6. 输出配置信息
      this.logConfiguration();
      
    } catch (error) {
      console.error('❌ 配置初始化失败:', error.message);
      
      // 使用安全的默认配置
      this.currentConfig = {
        BASE_URL: 'https://photo-pick-demo1.vercel.app',
        API_BASE: 'https://photo-pick-demo1.vercel.app',
        DEBUG: false,
        ENVIRONMENT: 'production',
        INITIALIZED_AT: new Date().toISOString(),
        ERROR: error.message
      };
      
      this.isInitialized = true;
      console.log('🔧 使用安全的默认配置');
      this.logConfiguration();
    }
  }
  
  logConfiguration() {
    console.log('✅ 配置管理器初始化完成');
    console.log('🌍 当前环境:', this.currentEnv);
    console.log('🔗 BASE_URL:', this.currentConfig.BASE_URL);
    console.log('🔗 API_BASE:', this.currentConfig.API_BASE);
    console.log('🐛 DEBUG模式:', this.currentConfig.DEBUG);
    
    if (this.currentConfig.ERROR) {
      console.warn('⚠️ 配置警告:', this.currentConfig.ERROR);
    }
  }
  
  getConfig() {
    if (!this.isInitialized) {
      throw new Error('配置管理器未初始化');
    }
    return { ...this.currentConfig };
  }
  
  getApiUrl(path = '') {
    const config = this.getConfig();
    const baseUrl = config.BASE_URL;
    
    if (!path) return baseUrl;
    
    // 确保路径格式正确
    const normalizedPath = path.startsWith('/') ? path : '/' + path;
    return baseUrl + normalizedPath;
  }
  
  validateCurrentConfig() {
    try {
      ConfigValidator.validateConfig(this.currentConfig);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

// 创建全局配置管理器实例
const configManager = new ConfigManager();

// 导出统一的配置接口
const CONFIG = configManager.getConfig();
const CURRENT_CONFIG = CONFIG;  // 向后兼容
const CURRENT_ENV = CONFIG.ENVIRONMENT;

// 其他配置常量
const VERSION = {
  appName: '快速选照片',
  versionCode: '1.0.0',
  buildNumber: '1',
  environment: CURRENT_ENV
};

const THEME = {
  primaryColor: '#FF2D83',
  secondaryColor: '#FF7EB3',
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
    gray1: '#F5F5F5',
    gray2: '#E5E5E5',
    gray3: '#D4D4D4',
    gray4: '#A3A3A3',
    gray5: '#737373',
    gray6: '#525252',
    gray7: '#404040',
    gray8: '#262626',
    gray9: '#171717'
  },
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  font: {
    title: {
      fontSize: '40rpx',
      fontWeight: '600',
      lineHeight: '56rpx'
    },
    subtitle: {
      fontSize: '28rpx',
      fontWeight: '400',
      lineHeight: '40rpx'
    },
    body: {
      fontSize: '24rpx',
      fontWeight: '400',
      lineHeight: '32rpx'
    },
    small: {
      fontSize: '20rpx',
      fontWeight: '400',
      lineHeight: '28rpx'
    }
  },
  borderRadius: {
    small: '8rpx',
    medium: '16rpx',
    large: '24rpx',
    extraLarge: '32rpx',
    full: '9999rpx'
  },
  shadow: {
    small: '0 2rpx 8rpx rgba(0, 0, 0, 0.08)',
    medium: '0 4rpx 16rpx rgba(0, 0, 0, 0.12)',
    large: '0 8rpx 32rpx rgba(0, 0, 0, 0.16)'
  }
};

const ANIMATION = {
  duration: {
    short: 150,
    medium: 300,
    long: 500
  },
  timing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out'
  }
};

const STORAGE_KEYS = {
  SESSION: 'PP_SESSION',
  ALBUM: 'PP_ALBUM_',
  AI_REASON: 'PP_AIREASON_',
  USER_SETTINGS: 'PP_USER_SETTINGS',
  CACHE: 'PP_CACHE_'
};

const API_ENDPOINTS = {
  upload: '/api/upload',
  pick: '/api/ai/pick',
  share: '/api/share',
  health: '/api/health'
};

const API_PATHS = API_ENDPOINTS; // For backward compatibility

const PERFORMANCE = {
  imageCompression: {
    maxWidth: 1600,
    quality: 0.8
  },
  loading: {
    firstScreenTimeout: 5000,
    preloadCount: 3
  }
};

const FEATURE_FLAGS = {
  AI_ENABLED: true,
  SHARE_ENABLED: true,
  I18N_ENABLED: false,
  DEBUG_MODE: false
};

// 导出配置管理器实例，供高级用法使用
const getConfigManager = () => configManager;

module.exports = {
  CONFIG,
  VERSION,
  THEME,
  ANIMATION,
  STORAGE_KEYS,
  API_PATHS,
  API_ENDPOINTS,
  PERFORMANCE,
  FEATURE_FLAGS,
  ENV_CONFIG,
  CURRENT_ENV,
  CURRENT_CONFIG,
  getConfigManager,
  ConfigValidator,
  EnvironmentDetector
};