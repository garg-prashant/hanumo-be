#!/usr/bin/env node

/**
 * Test script to demonstrate the Swagger API interface
 * This script tests various API endpoints to show they're working
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAPI() {
  console.log('🚀 Testing Hanumo API with Swagger Documentation\n');
  console.log('📖 Swagger UI available at: http://localhost:3000/api-docs\n');

  try {
    // Test health endpoint
    console.log('1. Testing Health Check...');
    const health = await makeRequest('/health');
    console.log(`   Status: ${health.status}`);
    console.log(`   Response: ${JSON.stringify(health.data, null, 2)}\n`);

    // Test properties endpoint
    console.log('2. Testing Properties List...');
    const properties = await makeRequest('/api/v1/properties');
    console.log(`   Status: ${properties.status}`);
    console.log(`   Response: ${JSON.stringify(properties.data, null, 2)}\n`);

    // Test Swagger JSON endpoint
    console.log('3. Testing Swagger JSON...');
    const swagger = await makeRequest('/api-docs.json');
    console.log(`   Status: ${swagger.status}`);
    if (swagger.data.info) {
      console.log(`   API Title: ${swagger.data.info.title}`);
      console.log(`   API Version: ${swagger.data.info.version}`);
      console.log(`   API Description: ${swagger.data.info.description}`);
    }
    console.log('');

    // Test authentication endpoint (should fail without token)
    console.log('4. Testing Authentication (without token)...');
    const auth = await makeRequest('/api/v1/users/me');
    console.log(`   Status: ${auth.status}`);
    console.log(`   Response: ${JSON.stringify(auth.data, null, 2)}\n`);

    console.log('✅ All tests completed!');
    console.log('\n📋 Available Swagger Documentation:');
    console.log('   • Swagger UI: http://localhost:3000/api-docs');
    console.log('   • OpenAPI JSON: http://localhost:3000/api-docs.json');
    console.log('\n🔧 You can now:');
    console.log('   • View interactive API documentation');
    console.log('   • Test endpoints directly from the browser');
    console.log('   • See request/response schemas');
    console.log('   • Try authentication flows');

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.log('\n💡 Make sure the server is running:');
    console.log('   npm run build && npm start');
  }
}

// Run the test
testAPI();
