const { spawn, exec } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

/**
 * 生产环境守护进程
 * 确保后端和代理服务器永远不会停止运行
 */
class ProductionGuardian {
  constructor() {
    this.backendProcess = null;
    this.proxyProcess = null;
    this.monitorInterval = null;
    this.checkInterval = 30000; // 30秒检查一次
    this.restartDelay = 5000; // 重启延迟5秒
    this.maxRestartAttempts = 10; // 最大重启尝试次数
    this.restartAttempts = {
      backend: 0,
      proxy: 0
    };
    this.logFile = path.join(__dirname, 'guardian.log');
    this.initLog();
  }

  // 初始化日志文件
  initLog() {
    const logHeader = `\n=== 生产环境守护进程启动 ${new Date().toISOString()} ===\n`;
    fs.appendFileSync(this.logFile, logHeader);
  }

  // 写入日志
  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(logMessage.trim());
    fs.appendFileSync(this.logFile, logMessage);
  }

  // 检查端口是否被占用
  async checkPort(port) {
    return new Promise((resolve) => {
      const server = require('net').createServer();
      server.listen(port, () => {
        server.once('close', () => resolve(false)); // 端口空闲
        server.close();
      });
      server.on('error', () => resolve(true)); // 端口被占用
    });
  }

  // 检查服务健康状态
  async checkServiceHealth(port, path = '/') {
    return new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: path,
        method: 'GET',
        timeout: 3000
      }, (res) => {
        resolve(res.statusCode === 200 || res.statusCode === 404); // 404也算正常（代理服务器）
      });

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  }

  // 强制杀死端口上的进程
  async killProcessOnPort(port) {
    return new Promise((resolve) => {
      exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
        if (error || !stdout) {
          resolve();
          return;
        }

        const lines = stdout.split('\n');
        const pids = new Set();
        
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5 && parts[1].includes(`:${port}`)) {
            pids.add(parts[4]);
          }
        });

        if (pids.size === 0) {
          resolve();
          return;
        }

        let killed = 0;
        pids.forEach(pid => {
          exec(`taskkill /F /PID ${pid}`, () => {
            killed++;
            if (killed === pids.size) resolve();
          });
        });
      });
    });
  }

  // 启动后端服务器
  async startBackend() {
    if (this.restartAttempts.backend >= this.maxRestartAttempts) {
      this.log(`❌ 后端服务器重启次数超过限制 (${this.maxRestartAttempts})，停止尝试`);
      return;
    }

    this.log('🚀 启动后端服务器...');
    
    // 确保端口5000没有被占用
    const portOccupied = await this.checkPort(5000);
    if (portOccupied) {
      this.log('⚠️ 端口5000被占用，正在清理...');
      await this.killProcessOnPort(5000);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    this.backendProcess = spawn('npm', ['start'], {
      cwd: path.join(__dirname, 'server'),
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });

    this.backendProcess.stdout.on('data', (data) => {
      this.log(`[后端] ${data.toString().trim()}`);
    });

    this.backendProcess.stderr.on('data', (data) => {
      this.log(`[后端错误] ${data.toString().trim()}`);
    });

    this.backendProcess.on('exit', (code) => {
      this.log(`❌ 后端服务器退出，代码: ${code}`);
      this.backendProcess = null;
      this.restartAttempts.backend++;
      
      setTimeout(() => {
        this.startBackend();
      }, this.restartDelay);
    });

    // 重置重启计数器（如果成功运行超过5分钟）
    setTimeout(() => {
      if (this.backendProcess) {
        this.restartAttempts.backend = 0;
      }
    }, 300000);
  }

  // 启动代理服务器
  async startProxy() {
    if (this.restartAttempts.proxy >= this.maxRestartAttempts) {
      this.log(`❌ 代理服务器重启次数超过限制 (${this.maxRestartAttempts})，停止尝试`);
      return;
    }

    this.log('🔗 启动代理服务器...');
    
    // 确保端口8080没有被占用
    const portOccupied = await this.checkPort(8080);
    if (portOccupied) {
      this.log('⚠️ 端口8080被占用，正在清理...');
      await this.killProcessOnPort(8080);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    this.proxyProcess = spawn('node', ['simple-https-proxy.js'], {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });

    this.proxyProcess.stdout.on('data', (data) => {
      this.log(`[代理] ${data.toString().trim()}`);
    });

    this.proxyProcess.stderr.on('data', (data) => {
      this.log(`[代理错误] ${data.toString().trim()}`);
    });

    this.proxyProcess.on('exit', (code) => {
      this.log(`❌ 代理服务器退出，代码: ${code}`);
      this.proxyProcess = null;
      this.restartAttempts.proxy++;
      
      setTimeout(() => {
        this.startProxy();
      }, this.restartDelay);
    });

    // 重置重启计数器（如果成功运行超过5分钟）
    setTimeout(() => {
      if (this.proxyProcess) {
        this.restartAttempts.proxy = 0;
      }
    }, 300000);
  }

  // 监控服务状态
  async monitorServices() {
    this.log('🔍 检查服务状态...');

    // 检查后端服务器
    const backendHealthy = await this.checkServiceHealth(5000);
    if (!backendHealthy && this.backendProcess) {
      this.log('⚠️ 后端服务器无响应，重启中...');
      this.backendProcess.kill();
    } else if (!backendHealthy && !this.backendProcess) {
      this.log('⚠️ 后端服务器未运行，启动中...');
      await this.startBackend();
    }

    // 检查代理服务器
    const proxyHealthy = await this.checkServiceHealth(8080);
    if (!proxyHealthy && this.proxyProcess) {
      this.log('⚠️ 代理服务器无响应，重启中...');
      this.proxyProcess.kill();
    } else if (!proxyHealthy && !this.proxyProcess) {
      this.log('⚠️ 代理服务器未运行，启动中...');
      await this.startProxy();
    }

    // 生成状态报告
    this.generateStatusReport();
  }

  // 生成状态报告
  generateStatusReport() {
    const status = {
      timestamp: new Date().toISOString(),
      backend: {
        running: !!this.backendProcess,
        restartAttempts: this.restartAttempts.backend
      },
      proxy: {
        running: !!this.proxyProcess,
        restartAttempts: this.restartAttempts.proxy
      }
    };

    this.log(`📊 状态报告: 后端=${status.backend.running ? '✅' : '❌'} 代理=${status.proxy.running ? '✅' : '❌'}`);
    
    // 写入状态文件
    fs.writeFileSync(
      path.join(__dirname, 'guardian-status.json'),
      JSON.stringify(status, null, 2)
    );
  }

  // 启动守护进程
  async start() {
    this.log('🛡️ 生产环境守护进程启动');
    
    // 初始启动服务
    await this.startBackend();
    await new Promise(resolve => setTimeout(resolve, 5000)); // 等待后端启动
    await this.startProxy();

    // 设置定期监控
    this.monitorInterval = setInterval(() => {
      this.monitorServices();
    }, this.checkInterval);

    // 优雅退出处理
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
    process.on('exit', () => this.stop());

    this.log('✅ 守护进程已启动，正在监控服务状态...');
  }

  // 停止守护进程
  stop() {
    this.log('🛑 停止守护进程...');
    
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }

    if (this.backendProcess) {
      this.backendProcess.kill();
    }

    if (this.proxyProcess) {
      this.proxyProcess.kill();
    }

    this.log('✅ 守护进程已停止');
    process.exit(0);
  }
}

// 启动守护进程
const guardian = new ProductionGuardian();
guardian.start().catch(error => {
  console.error('守护进程启动失败:', error);
  process.exit(1);
});