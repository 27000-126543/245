const http = require('http');

console.log('════════════════════════════════════════════════════════════');
console.log('🚀 智慧法院系统 - 后端API验证脚本');
console.log('════════════════════════════════════════════════════════════\n');

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  // Test 1: Health Check
  console.log('📋 Test 1: /api/health 健康检查');
  try {
    const res = await makeRequest('/api/health');
    if (res.status === 200 && res.data.status === 'ok') {
      console.log('   ✅ PASS - Status: 200, 服务运行正常');
      console.log(`      消息: ${res.data.message}`);
      passed++;
    } else {
      console.log('   ❌ FAIL');
      failed++;
    }
  } catch (e) {
    console.log(`   ❌ FAIL - ${e.message}`);
    failed++;
  }

  console.log('');

  // Test 2: Login
  console.log('📋 Test 2: /api/auth/login 登录接口');
  try {
    const res = await makeRequest('/api/auth/login', 'POST', {
      username: 'admin',
      password: 'admin123'
    });
    if (res.status === 200 && res.data.code === 200 && res.data.data.token) {
      console.log('   ✅ PASS - Status: 200, 登录成功');
      console.log(`      用户: ${res.data.data.user.name} (${res.data.data.user.role})`);
      passed++;
    } else {
      console.log('   ❌ FAIL');
      console.log(`      Status: ${res.status}, Data:`, res.data);
      failed++;
    }
  } catch (e) {
    console.log(`   ❌ FAIL - ${e.message}`);
    failed++;
  }

  console.log('');

  // Test 3: Dashboard Stats
  console.log('📋 Test 3: /api/stats/dashboard 首页大屏数据');
  try {
    const res = await makeRequest('/api/stats/dashboard');
    if (res.status === 200 && res.data.data.overview.totalCases === 55) {
      console.log('   ✅ PASS - Status: 200, 55条案件种子数据验证通过');
      console.log(`      案件总数: ${res.data.data.overview.totalCases}`);
      console.log(`      待立案: ${res.data.data.overview.pendingCases}`);
      console.log(`      审理中: ${res.data.data.overview.trialCases}`);
      console.log(`      已结案: ${res.data.data.overview.closedCases}`);
      passed++;
    } else {
      console.log('   ❌ FAIL');
      console.log(`      Status: ${res.status}, 案件数: ${res.data.data?.overview?.totalCases}`);
      failed++;
    }
  } catch (e) {
    console.log(`   ❌ FAIL - ${e.message}`);
    failed++;
  }

  console.log('\n════════════════════════════════════════════════════════════');
  console.log(`📊 测试结果: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('🎉 所有测试通过！后端服务运行正常！');
  } else {
    console.log('⚠️  部分测试失败，请检查服务状态');
    process.exit(1);
  }
  console.log('════════════════════════════════════════════════════════════\n');
}

runTests();
