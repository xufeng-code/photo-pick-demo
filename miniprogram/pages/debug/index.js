// pages/debug/index.js
const { CONFIG, EnvironmentDetector } = require('../../utils/config.js');

Page({
  data: {
    currentEnv: '',
    baseUrl: '',
    debugMode: false,
    accountInfo: null,
    configInfo: null
  },

  onLoad() {
    this.detectEnvironment();
    this.loadConfig();
  },

  detectEnvironment() {
    try {
      // 获取小程序账户信息
      const accountInfo = wx.getAccountInfoSync();
      console.log('账户信息:', accountInfo);
      
      // 检测环境
      const currentEnv = EnvironmentDetector.detectEnvironment();
      console.log('当前环境:', currentEnv);
      
      this.setData({
        currentEnv: currentEnv,
        accountInfo: accountInfo,
        baseUrl: CONFIG.BASE_URL,
        debugMode: CONFIG.DEBUG
      });
    } catch (error) {
      console.error('环境检测失败:', error);
      this.setData({
        currentEnv: 'error',
        accountInfo: { error: error.message }
      });
    }
  },

  loadConfig() {
    try {
      this.setData({
        configInfo: {
          BASE_URL: CONFIG.BASE_URL,
          DEBUG: CONFIG.DEBUG,
          ENVIRONMENT: CONFIG.ENVIRONMENT,
          INITIALIZED_AT: CONFIG.INITIALIZED_AT
        }
      });
    } catch (error) {
      console.error('配置加载失败:', error);
    }
  },

  testApiConnection() {
    wx.showLoading({
      title: '测试连接中...'
    });

    wx.request({
      url: `${CONFIG.BASE_URL}/api/health`,
      method: 'GET',
      success: (res) => {
        wx.hideLoading();
        wx.showModal({
          title: '连接测试成功',
          content: `状态码: ${res.statusCode}\n响应: ${JSON.stringify(res.data)}`,
          showCancel: false
        });
      },
      fail: (error) => {
        wx.hideLoading();
        wx.showModal({
          title: '连接测试失败',
          content: `错误: ${error.errMsg}`,
          showCancel: false
        });
      }
    });
  },

  copyConfig() {
    const configText = JSON.stringify(this.data.configInfo, null, 2);
    wx.setClipboardData({
      data: configText,
      success: () => {
        wx.showToast({
          title: '配置已复制',
          icon: 'success'
        });
      }
    });
  }
});