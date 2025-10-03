// scripts/config-env.js
/**
 * 环境配置管理脚本
 * 用于快速切换不同环境的配置
 */

const fs = require('fs');
const path = require('path');

// 环境配置模板
const ENV_CONFIGS = {
  development: {
    BASE_URL: 'http://localhost:3000',
    description: '开发环境 - 本地服务器'
  },
  staging: {
    BASE_URL: 'https://your-ngrok-domain.ngrok.io',
    description: '测试环境 - ngrok HTTPS 域名'
  },
  production: {
    BASE_URL: 'https://your-production-domain.com',
    description: '生产环境 - 正式 HTTPS 域名'
  }
};

/**
 * 更新配置文件中的环境配置
 * @param {string} env - 环境名称
 * @param {string} baseUrl - BASE_URL
 */
function updateConfig(env, baseUrl) {
  const configPath = path.join(__dirname, '../utils/config.js');
  
  try {
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // 更新指定环境的 BASE_URL
    const envPattern = new RegExp(
      `(${env}:\\s*{[^}]*BASE_URL:\\s*')[^']*(')`
    );
    
    if (envPattern.test(configContent)) {
      configContent = configContent.replace(envPattern, `$1${baseUrl}$2`);
      fs.writeFileSync(configPath, configContent, 'utf8');
      console.log(`✅ 已更新 ${env} 环境的 BASE_URL 为: ${baseUrl}`);
    } else {
      console.error(`❌ 未找到 ${env} 环境配置`);
    }
  } catch (error) {
    console.error('❌ 更新配置文件失败:', error.message);
  }
}

/**
 * 显示当前配置
 */
function showCurrentConfig() {
  console.log('\n📋 当前环境配置:');
  console.log('================');
  
  Object.entries(ENV_CONFIGS).forEach(([env, config]) => {
    console.log(`${env.toUpperCase()}:`);
    console.log(`  BASE_URL: ${config.BASE_URL}`);
    console.log(`  描述: ${config.description}`);
    console.log('');
  });
}

/**
 * 显示使用说明
 */
function showUsage() {
  console.log('\n🔧 环境配置管理工具');
  console.log('==================');
  console.log('');
  console.log('使用方法:');
  console.log('  node scripts/config-env.js [命令] [参数]');
  console.log('');
  console.log('命令:');
  console.log('  show                    - 显示当前配置');
  console.log('  set <env> <url>        - 设置指定环境的 BASE_URL');
  console.log('  staging <ngrok-url>    - 快速设置 staging 环境的 ngrok 域名');
  console.log('  prod <domain>          - 快速设置生产环境域名');
  console.log('');
  console.log('示例:');
  console.log('  node scripts/config-env.js show');
  console.log('  node scripts/config-env.js staging https://abc123.ngrok.io');
  console.log('  node scripts/config-env.js prod https://api.yourapp.com');
  console.log('');
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showUsage();
    return;
  }
  
  const command = args[0];
  
  switch (command) {
    case 'show':
      showCurrentConfig();
      break;
      
    case 'set':
      if (args.length < 3) {
        console.error('❌ 请提供环境名称和 BASE_URL');
        console.log('用法: node scripts/config-env.js set <env> <url>');
        return;
      }
      updateConfig(args[1], args[2]);
      break;
      
    case 'staging':
      if (args.length < 2) {
        console.error('❌ 请提供 ngrok 域名');
        console.log('用法: node scripts/config-env.js staging <ngrok-url>');
        return;
      }
      updateConfig('staging', args[1]);
      break;
      
    case 'prod':
    case 'production':
      if (args.length < 2) {
        console.error('❌ 请提供生产环境域名');
        console.log('用法: node scripts/config-env.js prod <domain>');
        return;
      }
      updateConfig('production', args[1]);
      break;
      
    default:
      console.error(`❌ 未知命令: ${command}`);
      showUsage();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  updateConfig,
  showCurrentConfig,
  ENV_CONFIGS
};