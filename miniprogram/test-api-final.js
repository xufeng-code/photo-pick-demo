const https = require('https');

async function testAPI(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = `https://photo-pick-demo1.vercel.app${endpoint}`;
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js Test Client'
      }
    };

    if (data && method === 'POST') {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data && method === 'POST') {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('🧪 测试 Vercel API 端点...\n');

  // 测试简单的 GET 端点
  try {
    console.log('1. 测试 /api/test (GET)');
    const testResult = await testAPI('/api/test', 'GET');
    console.log(`   状态码: ${testResult.statusCode}`);
    console.log(`   Content-Type: ${testResult.headers['content-type']}`);
    console.log(`   响应: ${testResult.body.substring(0, 200)}`);
    
    if (testResult.statusCode === 200 && testResult.headers['content-type']?.includes('application/json')) {
      console.log('   ✅ 测试通过\n');
    } else {
      console.log('   ❌ 测试失败\n');
    }
  } catch (err) {
    console.log(`   ❌ 错误: ${err.message}\n`);
  }

  // 测试 hello 端点
  try {
    console.log('2. 测试 /api/hello (GET)');
    const helloResult = await testAPI('/api/hello', 'GET');
    console.log(`   状态码: ${helloResult.statusCode}`);
    console.log(`   Content-Type: ${helloResult.headers['content-type']}`);
    console.log(`   响应: ${helloResult.body.substring(0, 200)}`);
    
    if (helloResult.statusCode === 200 && helloResult.headers['content-type']?.includes('application/json')) {
      console.log('   ✅ 测试通过\n');
    } else {
      console.log('   ❌ 测试失败\n');
    }
  } catch (err) {
    console.log(`   ❌ 错误: ${err.message}\n`);
  }

  // 测试 AI pick 端点
  try {
    console.log('3. 测试 /api/ai/pick (POST)');
    const pickData = {
      images: [
        { id: 'test1', filename: 'test1.jpg' },
        { id: 'test2', filename: 'test2.jpg' }
      ]
    };
    const pickResult = await testAPI('/api/ai/pick', 'POST', pickData);
    console.log(`   状态码: ${pickResult.statusCode}`);
    console.log(`   Content-Type: ${pickResult.headers['content-type']}`);
    console.log(`   响应: ${pickResult.body.substring(0, 200)}`);
    
    if (pickResult.statusCode === 200 && pickResult.headers['content-type']?.includes('application/json')) {
      console.log('   ✅ 测试通过\n');
    } else {
      console.log('   ❌ 测试失败\n');
    }
  } catch (err) {
    console.log(`   ❌ 错误: ${err.message}\n`);
  }

  console.log('🏁 测试完成');
}

runTests().catch(console.error);