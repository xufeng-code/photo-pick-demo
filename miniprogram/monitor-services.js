// monitor-services.js - 服务器监控和自动重启脚本
const { spawn } = require('child_process');
const http = require('http');

class ServiceMonitor {
  constructor() {
    this.backendProcess = null;
    this.proxyProcess = null;
    this.monitorInterval = 30000; // 30秒检查一次
    this.restartDelay = 5000; // 重启延迟5秒
  }

  // 检查服务是否运行
  async checkService(port, name) {
    return new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: port,
        method: 'GET',
        timeout: 5000
      }, (res) => {
        resolve(true);
      });

      req.on('error', () => {
        resolve(false);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  }

  // 启动后端服务器
  startBackend() {
    console.log('🚀 启动后端服务器...');
    this.backendProcess = spawn('npm', ['start'], {
      cwd: './server',
      stdio: 'inherit',
      shell: true
    });

    this.backendProcess.on('exit', (code) => {
      console.log(`❌ 后端服务器退出，代码: ${code}`);
      this.backendProcess = null;
      setTimeout(() => this.startBackend(), this.restartDelay);
    });
  }

  // 启动代理服务器
  startProxy() {
    console.log('🔗 启动代理服务器...');
    this.proxyProcess = spawn('node', ['simple-https-proxy.js'], {
      stdio: 'inherit',
      shell: true
    });

    this.proxyProcess.on('exit', (code) => {
      console.log(`❌ 代理服务器退出，代码: ${code}`);
      this.proxyProcess = null;
      setTimeout(() => this.startProxy(), this.restartDelay);
    });
  }

  // 监控服务状态
  async monitorServices() {
    const backendRunning = await this.checkService(5000, '后端服务器');
    const proxyRunning = await this.checkService(8080, '代理服务器');

    console.log(`📊 服务状态检查 - 后端: ${backendRunning ? '✅' : '❌'}, 代理: ${proxyRunning ? '✅' : '❌'}`);

    if (!backendRunning && !this.backendProcess) {
      console.log('🔄 后端服务器未运行，正在重启...');
      this.startBackend();
    }

    if (!proxyRunning && !this.proxyProcess) {
      console.log('🔄 代理服务器未运行，正在重启...');
      this.startProxy();
    }
  }

  // 启动监控
  start() {
    console.log('🎯 启动服务监控系统...');
    console.log(`⏰ 监控间隔: ${this.monitorInterval / 1000}秒`);
    
    // 初始启动服务
    this.startBackend();
    setTimeout(() => this.startProxy(), 3000); // 延迟启动代理服务器

    // 定期监控
    setInterval(() => {
      this.monitorServices();
    }, this.monitorInterval);

    // 优雅退出处理
    process.on('SIGINT', () => {
      console.log('\n🛑 正在停止服务监控...');
      if (this.backendProcess) this.backendProcess.kill();
      if (this.proxyProcess) this.proxyProcess.kill();
      process.exit(0);
    });
  }
}

// 启动监控
const monitor = new ServiceMonitor();
monitor.start();

console.log(`
🎉 选照片小程序生产环境监控已启动！

📱 小程序访问地址: http://192.168.1.6:8080
🖥️  后端服务器: http://localhost:5000
🔗 代理服务器: http://192.168.1.6:8080

💡 监控功能:
   - 自动检测服务器状态
   - 服务器崩溃时自动重启
   - 30秒间隔健康检查

⚠️  注意: 按 Ctrl+C 停止监控
`);