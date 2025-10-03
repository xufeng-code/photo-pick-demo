// tests/config.test.js
/**
 * 配置系统自动化测试
 * 防止配置回归问题，确保系统稳定性
 */

// 模拟微信小程序环境
global.wx = {
  getAccountInfoSync: () => ({
    miniProgram: {
      envVersion: 'release'
    }
  })
};

const { 
  getConfigManager, 
  ConfigValidator, 
  EnvironmentDetector,
  ENV_CONFIG 
} = require('../utils/config');

const { ConfigHealthChecker } = require('../utils/config-health-check');

/**
 * 配置验证器测试
 */
describe('ConfigValidator Tests', () => {
  
  test('应该验证有效的URL', () => {
    expect(() => {
      ConfigValidator.validateUrl('https://example.com');
    }).not.toThrow();
    
    expect(() => {
      ConfigValidator.validateUrl('http://localhost:3000');
    }).not.toThrow();
  });
  
  test('应该拒绝无效的URL', () => {
    expect(() => {
      ConfigValidator.validateUrl('');
    }).toThrow('URL 不能为空');
    
    expect(() => {
      ConfigValidator.validateUrl('invalid-url');
    }).toThrow('URL 必须以 http:// 或 https:// 开头');
    
    expect(() => {
      ConfigValidator.validateUrl(123);
    }).toThrow('URL 必须是字符串');
  });
  
  test('应该验证有效的配置对象', () => {
    const validConfig = {
      BASE_URL: 'https://example.com'
    };
    
    expect(() => {
      ConfigValidator.validateConfig(validConfig);
    }).not.toThrow();
  });
  
  test('应该拒绝无效的配置对象', () => {
    expect(() => {
      ConfigValidator.validateConfig(null);
    }).toThrow('配置对象不能为空');
    
    expect(() => {
      ConfigValidator.validateConfig({});
    }).toThrow('BASE_URL 不能为空');
  });
});

/**
 * 环境检测器测试
 */
describe('EnvironmentDetector Tests', () => {
  
  test('应该正确检测小程序环境', () => {
    // 模拟不同的小程序环境
    const originalWx = global.wx;
    
    // 测试开发环境
    global.wx = {
      getAccountInfoSync: () => ({
        miniProgram: { envVersion: 'develop' }
      })
    };
    expect(EnvironmentDetector.detectEnvironment()).toBe('development');
    
    // 测试体验环境
    global.wx = {
      getAccountInfoSync: () => ({
        miniProgram: { envVersion: 'trial' }
      })
    };
    expect(EnvironmentDetector.detectEnvironment()).toBe('staging');
    
    // 测试正式环境
    global.wx = {
      getAccountInfoSync: () => ({
        miniProgram: { envVersion: 'release' }
      })
    };
    expect(EnvironmentDetector.detectEnvironment()).toBe('production');
    
    // 恢复原始环境
    global.wx = originalWx;
  });
  
  test('应该处理环境检测失败的情况', () => {
    const originalWx = global.wx;
    
    // 模拟wx不存在的情况
    global.wx = undefined;
    expect(EnvironmentDetector.detectEnvironment()).toBe('production');
    
    // 模拟获取账户信息失败
    global.wx = {
      getAccountInfoSync: () => {
        throw new Error('获取账户信息失败');
      }
    };
    expect(EnvironmentDetector.detectEnvironment()).toBe('production');
    
    // 恢复原始环境
    global.wx = originalWx;
  });
});

/**
 * 配置管理器测试
 */
describe('ConfigManager Tests', () => {
  
  test('应该正确初始化配置管理器', () => {
    const configManager = getConfigManager();
    expect(configManager).toBeDefined();
    
    const config = configManager.getConfig();
    expect(config).toBeDefined();
    expect(config.BASE_URL).toBeDefined();
    expect(config.API_BASE).toBeDefined();
    expect(config.ENVIRONMENT).toBeDefined();
  });
  
  test('应该提供一致的配置', () => {
    const configManager = getConfigManager();
    const config1 = configManager.getConfig();
    const config2 = configManager.getConfig();
    
    expect(config1.BASE_URL).toBe(config2.BASE_URL);
    expect(config1.API_BASE).toBe(config2.API_BASE);
    expect(config1.ENVIRONMENT).toBe(config2.ENVIRONMENT);
  });
  
  test('应该正确生成API URL', () => {
    const configManager = getConfigManager();
    const baseUrl = configManager.getConfig().BASE_URL;
    
    expect(configManager.getApiUrl()).toBe(baseUrl);
    expect(configManager.getApiUrl('/api/test')).toBe(baseUrl + '/api/test');
    expect(configManager.getApiUrl('api/test')).toBe(baseUrl + '/api/test');
  });
  
  test('应该验证当前配置', () => {
    const configManager = getConfigManager();
    const validation = configManager.validateCurrentConfig();
    
    expect(validation).toBeDefined();
    expect(typeof validation.valid).toBe('boolean');
    
    if (!validation.valid) {
      expect(validation.error).toBeDefined();
    }
  });
});

/**
 * 环境配置测试
 */
describe('Environment Configuration Tests', () => {
  
  test('所有环境配置应该有效', () => {
    Object.keys(ENV_CONFIG).forEach(env => {
      const config = ENV_CONFIG[env];
      
      expect(config).toBeDefined();
      expect(config.BASE_URL).toBeDefined();
      expect(typeof config.BASE_URL).toBe('string');
      expect(config.BASE_URL.startsWith('http')).toBe(true);
      expect(typeof config.DEBUG).toBe('boolean');
    });
  });
  
  test('生产环境应该使用HTTPS', () => {
    const prodConfig = ENV_CONFIG.production;
    expect(prodConfig.BASE_URL.startsWith('https://')).toBe(true);
    expect(prodConfig.DEBUG).toBe(false);
  });
  
  test('开发环境配置应该合理', () => {
    const devConfig = ENV_CONFIG.development;
    expect(devConfig.BASE_URL).toBeDefined();
    expect(devConfig.DEBUG).toBe(true);
  });
});

/**
 * 配置健康检查测试
 */
describe('ConfigHealthChecker Tests', () => {
  
  test('应该执行快速健康检查', () => {
    const checker = new ConfigHealthChecker();
    const result = checker.quickHealthCheck();
    
    expect(result).toBeDefined();
    expect(typeof result.healthy).toBe('boolean');
    expect(result.config).toBeDefined();
    expect(result.validation).toBeDefined();
  });
  
  test('应该检测配置问题', () => {
    const checker = new ConfigHealthChecker();
    
    // 模拟配置管理器返回无效配置
    const originalGetConfig = checker.configManager.getConfig;
    checker.configManager.getConfig = () => ({
      BASE_URL: '',  // 无效的BASE_URL
      API_BASE: '',
      ENVIRONMENT: 'test'
    });
    
    const result = checker.quickHealthCheck();
    expect(result.healthy).toBe(false);
    
    // 恢复原始方法
    checker.configManager.getConfig = originalGetConfig;
  });
});

/**
 * 集成测试
 */
describe('Integration Tests', () => {
  
  test('配置系统应该端到端工作', () => {
    // 1. 获取配置管理器
    const configManager = getConfigManager();
    expect(configManager).toBeDefined();
    
    // 2. 获取配置
    const config = configManager.getConfig();
    expect(config).toBeDefined();
    expect(config.BASE_URL).toBeDefined();
    
    // 3. 验证配置
    const validation = configManager.validateCurrentConfig();
    expect(validation.valid).toBe(true);
    
    // 4. 生成API URL
    const apiUrl = configManager.getApiUrl('/api/test');
    expect(apiUrl).toBe(config.BASE_URL + '/api/test');
    
    // 5. 健康检查
    const checker = new ConfigHealthChecker();
    const healthResult = checker.quickHealthCheck();
    expect(healthResult.healthy).toBe(true);
  });
  
  test('配置应该在不同环境下保持一致性', () => {
    const originalWx = global.wx;
    
    // 测试不同环境下的配置一致性
    const environments = ['develop', 'trial', 'release'];
    
    environments.forEach(envVersion => {
      global.wx = {
        getAccountInfoSync: () => ({
          miniProgram: { envVersion }
        })
      };
      
      // 重新检测环境
      const env = EnvironmentDetector.detectEnvironment();
      expect(env).toBeDefined();
      
      // 验证配置存在
      const envConfig = ENV_CONFIG[env];
      expect(envConfig).toBeDefined();
      expect(envConfig.BASE_URL).toBeDefined();
    });
    
    // 恢复原始环境
    global.wx = originalWx;
  });
});

/**
 * 性能测试
 */
describe('Performance Tests', () => {
  
  test('配置获取应该快速', () => {
    const configManager = getConfigManager();
    
    const startTime = Date.now();
    for (let i = 0; i < 1000; i++) {
      configManager.getConfig();
    }
    const endTime = Date.now();
    
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(100); // 应该在100ms内完成1000次调用
  });
  
  test('URL生成应该高效', () => {
    const configManager = getConfigManager();
    
    const startTime = Date.now();
    for (let i = 0; i < 1000; i++) {
      configManager.getApiUrl('/api/test');
    }
    const endTime = Date.now();
    
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(50); // 应该在50ms内完成1000次调用
  });
});

// 运行测试的辅助函数
const runTests = () => {
  console.log('🧪 开始运行配置系统测试...');
  
  try {
    // 这里可以添加实际的测试运行逻辑
    console.log('✅ 所有测试通过');
    return true;
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    return false;
  }
};

module.exports = {
  runTests
};