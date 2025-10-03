// utils/config-health-check.js
/**
 * 配置健康检查工具
 * 确保运行时配置的一致性和正确性
 */

const { getConfigManager, ConfigValidator, API_ENDPOINTS } = require('./config');

/**
 * 配置健康检查器
 */
class ConfigHealthChecker {
  constructor() {
    this.configManager = getConfigManager();
    this.checkResults = [];
  }

  /**
   * 执行完整的健康检查
   */
  async performHealthCheck() {
    console.log('🔍 开始配置健康检查...');
    this.checkResults = [];

    try {
      // 1. 基础配置检查
      await this.checkBasicConfiguration();
      
      // 2. 网络连接检查
      await this.checkNetworkConnectivity();
      
      // 3. API端点检查
      await this.checkApiEndpoints();
      
      // 4. 环境一致性检查
      await this.checkEnvironmentConsistency();
      
      // 5. 生成检查报告
      this.generateHealthReport();
      
      return this.getHealthStatus();
      
    } catch (error) {
      console.error('❌ 健康检查失败:', error.message);
      this.addCheckResult('HEALTH_CHECK', false, `健康检查失败: ${error.message}`);
      return { healthy: false, error: error.message };
    }
  }

  /**
   * 基础配置检查
   */
  async checkBasicConfiguration() {
    try {
      const config = this.configManager.getConfig();
      
      // 检查配置对象是否存在
      if (!config) {
        this.addCheckResult('CONFIG_EXISTS', false, '配置对象不存在');
        return;
      }
      
      this.addCheckResult('CONFIG_EXISTS', true, '配置对象存在');
      
      // 检查必要字段
      const requiredFields = ['BASE_URL', 'API_BASE', 'ENVIRONMENT'];
      for (const field of requiredFields) {
        if (!config[field]) {
          this.addCheckResult(`CONFIG_${field}`, false, `缺少必要字段: ${field}`);
        } else {
          this.addCheckResult(`CONFIG_${field}`, true, `字段 ${field} 存在: ${config[field]}`);
        }
      }
      
      // 验证配置格式
      const validation = this.configManager.validateCurrentConfig();
      if (validation.valid) {
        this.addCheckResult('CONFIG_VALIDATION', true, '配置格式验证通过');
      } else {
        this.addCheckResult('CONFIG_VALIDATION', false, `配置格式验证失败: ${validation.error}`);
      }
      
    } catch (error) {
      this.addCheckResult('CONFIG_BASIC', false, `基础配置检查失败: ${error.message}`);
    }
  }

  /**
   * 网络连接检查
   */
  async checkNetworkConnectivity() {
    try {
      const config = this.configManager.getConfig();
      const baseUrl = config.BASE_URL;
      
      if (!baseUrl) {
        this.addCheckResult('NETWORK_CONFIG', false, 'BASE_URL 未配置');
        return;
      }
      
      // 检查是否在微信小程序环境
      if (typeof wx === 'undefined') {
        this.addCheckResult('NETWORK_CONNECTIVITY', true, '非小程序环境，跳过网络检查');
        return;
      }
      
      // 执行网络请求测试
      const testUrl = `${baseUrl}/api/health`;
      
      return new Promise((resolve) => {
        wx.request({
          url: testUrl,
          method: 'GET',
          timeout: 5000,
          success: (res) => {
            if (res.statusCode === 200) {
              this.addCheckResult('NETWORK_CONNECTIVITY', true, `网络连接正常: ${testUrl}`);
            } else {
              this.addCheckResult('NETWORK_CONNECTIVITY', false, `网络连接异常，状态码: ${res.statusCode}`);
            }
            resolve();
          },
          fail: (error) => {
            this.addCheckResult('NETWORK_CONNECTIVITY', false, `网络连接失败: ${error.errMsg || error.message}`);
            resolve();
          }
        });
      });
      
    } catch (error) {
      this.addCheckResult('NETWORK_CONNECTIVITY', false, `网络检查失败: ${error.message}`);
    }
  }

  /**
   * API端点检查
   */
  async checkApiEndpoints() {
    try {
      const config = this.configManager.getConfig();
      const baseUrl = config.BASE_URL;
      
      if (!baseUrl) {
        this.addCheckResult('API_ENDPOINTS', false, 'BASE_URL 未配置，无法检查API端点');
        return;
      }
      
      // 检查关键API端点
      const criticalEndpoints = [
        API_ENDPOINTS.pick
        // '/api/upload' // 已移除，现在直接使用base64发送到/api/pick
      ];
      
      for (const endpoint of criticalEndpoints) {
        const fullUrl = baseUrl + endpoint;
        try {
          // 验证URL格式
          new URL(fullUrl);
          this.addCheckResult(`API_ENDPOINT_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`, true, `端点URL格式正确: ${fullUrl}`);
        } catch (error) {
          this.addCheckResult(`API_ENDPOINT_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`, false, `端点URL格式错误: ${fullUrl}`);
        }
      }
      
    } catch (error) {
      this.addCheckResult('API_ENDPOINTS', false, `API端点检查失败: ${error.message}`);
    }
  }

  /**
   * 环境一致性检查
   */
  async checkEnvironmentConsistency() {
    try {
      const config = this.configManager.getConfig();
      
      // 检查环境变量一致性
      const environment = config.ENVIRONMENT;
      const baseUrl = config.BASE_URL;
      
      // 验证环境与URL的一致性
      if (environment === 'production' && !baseUrl.includes('vercel.app')) {
        this.addCheckResult('ENV_CONSISTENCY', false, '生产环境应使用Vercel部署地址');
      } else if (environment === 'development' && baseUrl.includes('localhost')) {
        this.addCheckResult('ENV_CONSISTENCY', true, '开发环境配置一致');
      } else {
        this.addCheckResult('ENV_CONSISTENCY', true, '环境配置一致');
      }
      
      // 检查HTTPS要求（小程序环境）
      if (typeof wx !== 'undefined' && !baseUrl.startsWith('https://')) {
        this.addCheckResult('HTTPS_REQUIREMENT', false, '小程序环境要求使用HTTPS');
      } else {
        this.addCheckResult('HTTPS_REQUIREMENT', true, 'HTTPS要求满足');
      }
      
    } catch (error) {
      this.addCheckResult('ENV_CONSISTENCY', false, `环境一致性检查失败: ${error.message}`);
    }
  }

  /**
   * 添加检查结果
   */
  addCheckResult(checkName, passed, message) {
    this.checkResults.push({
      name: checkName,
      passed,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 生成健康报告
   */
  generateHealthReport() {
    const totalChecks = this.checkResults.length;
    const passedChecks = this.checkResults.filter(r => r.passed).length;
    const failedChecks = totalChecks - passedChecks;
    
    console.log('\n📊 配置健康检查报告');
    console.log('='.repeat(50));
    console.log(`总检查项: ${totalChecks}`);
    console.log(`✅ 通过: ${passedChecks}`);
    console.log(`❌ 失败: ${failedChecks}`);
    console.log(`🎯 健康度: ${Math.round((passedChecks / totalChecks) * 100)}%`);
    console.log('='.repeat(50));
    
    // 显示详细结果
    this.checkResults.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.name}: ${result.message}`);
    });
    
    console.log('='.repeat(50));
  }

  /**
   * 获取健康状态
   */
  getHealthStatus() {
    const totalChecks = this.checkResults.length;
    const passedChecks = this.checkResults.filter(r => r.passed).length;
    const healthScore = Math.round((passedChecks / totalChecks) * 100);
    
    return {
      healthy: healthScore >= 80,
      score: healthScore,
      totalChecks,
      passedChecks,
      failedChecks: totalChecks - passedChecks,
      results: this.checkResults
    };
  }

  /**
   * 快速健康检查（仅基础检查）
   */
  quickHealthCheck() {
    try {
      const config = this.configManager.getConfig();
      const validation = this.configManager.validateCurrentConfig();
      
      return {
        healthy: validation.valid && !!config.BASE_URL,
        config: config,
        validation: validation
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }
}

/**
 * 自动健康检查（在应用启动时运行）
 */
const performAutoHealthCheck = async () => {
  try {
    console.log('🚀 执行自动配置健康检查...');
    const checker = new ConfigHealthChecker();
    const result = await checker.performHealthCheck();
    
    if (!result.healthy) {
      console.warn('⚠️ 配置健康检查发现问题，请检查配置');
    } else {
      console.log('✅ 配置健康检查通过');
    }
    
    return result;
  } catch (error) {
    console.error('❌ 自动健康检查失败:', error.message);
    return { healthy: false, error: error.message };
  }
};

module.exports = {
  ConfigHealthChecker,
  performAutoHealthCheck
};