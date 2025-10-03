// app.js
const { performAutoHealthCheck } = require('./utils/config-health-check');
const { getConfigManager } = require('./utils/config');

App({
  globalData: {
    // 全局数据存储
    photos: [], // 照片列表
    aiResult: null, // AI分析结果
    compareResult: null, // 对比结果
    compareDecisions: {}, // 照片对比决策
    session: {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }, // 会话信息
    configHealth: null // 配置健康状态
  },

  async onLaunch() {
    console.log('🚀 小程序启动，session ID:', this.globalData.session.id);
    
    try {
      // 1. 执行配置健康检查
      console.log('🔍 执行启动时配置检查...');
      const healthResult = await performAutoHealthCheck();
      this.globalData.configHealth = healthResult;
      
      if (!healthResult.healthy) {
        console.warn('⚠️ 配置健康检查发现问题，但应用将继续运行');
        console.warn('健康度:', healthResult.score + '%');
      } else {
        console.log('✅ 配置健康检查通过，健康度:', healthResult.score + '%');
      }
      
      // 2. 输出当前配置信息
      const configManager = getConfigManager();
      const config = configManager.getConfig();
      console.log('📋 当前配置信息:');
      console.log('  - 环境:', config.ENVIRONMENT);
      console.log('  - API地址:', config.BASE_URL);
      console.log('  - 调试模式:', config.DEBUG);
      
      // 3. 设置全局错误处理
      this.setupGlobalErrorHandling();
      
    } catch (error) {
      console.error('❌ 应用启动时配置检查失败:', error.message);
      // 即使配置检查失败，也不阻止应用启动
      this.globalData.configHealth = { 
        healthy: false, 
        error: error.message,
        score: 0
      };
    }
  },

  /**
   * 设置全局错误处理
   */
  setupGlobalErrorHandling() {
    // 监听未捕获的Promise错误
    if (typeof wx !== 'undefined' && wx.onUnhandledRejection) {
      wx.onUnhandledRejection((res) => {
        console.error('❌ 未处理的Promise错误:', res.reason);
        
        // 检查是否是配置相关错误
        if (res.reason && res.reason.message && 
            (res.reason.message.includes('配置') || 
             res.reason.message.includes('BASE_URL') ||
             res.reason.message.includes('API_BASE'))) {
          console.error('🔧 检测到配置相关错误，建议检查配置系统');
          
          // 可以在这里触发配置修复逻辑
          this.attemptConfigRecovery();
        }
      });
    }
  },

  /**
   * 尝试配置恢复
   */
  async attemptConfigRecovery() {
    try {
      console.log('🔧 尝试配置恢复...');
      
      const configManager = getConfigManager();
      const validation = configManager.validateCurrentConfig();
      
      if (!validation.valid) {
        console.error('❌ 配置验证失败:', validation.error);
        
        // 这里可以实现配置修复逻辑
        // 例如：重新初始化配置、使用备用配置等
        
        wx.showToast({
          title: '配置异常，请重启应用',
          icon: 'none',
          duration: 3000
        });
      } else {
        console.log('✅ 配置验证通过，无需恢复');
      }
      
    } catch (error) {
      console.error('❌ 配置恢复失败:', error.message);
    }
  },

  /**
   * 获取配置健康状态
   */
  getConfigHealth() {
    return this.globalData.configHealth;
  }
})
