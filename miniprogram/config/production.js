// 生产环境配置
module.exports = {
  // 生产环境域名（需要替换为实际域名）
  BASE_URL: 'https://api.yourapp.com',
  API_BASE: 'https://api.yourapp.com',
  
  // 服务器配置
  SERVER: {
    HTTP_PORT: 80,
    HTTPS_PORT: 443,
    HOST: '0.0.0.0'
  },
  
  // SSL证书路径
  SSL: {
    KEY_PATH: '/path/to/your/private.key',
    CERT_PATH: '/path/to/your/certificate.crt',
    CA_PATH: '/path/to/your/ca_bundle.crt' // 可选
  },
  
  // 微信小程序配置
  WECHAT: {
    // 需要在微信公众平台配置的合法域名
    VALID_DOMAINS: [
      'api.yourapp.com'
    ]
  },
  
  // 安全配置
  SECURITY: {
    FORCE_HTTPS: true,
    CORS_ORIGIN: ['https://yourapp.com'], // 限制CORS来源
    MAX_FILE_SIZE: '50mb'
  }
};