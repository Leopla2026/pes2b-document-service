const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

process.env.API_KEY_REQUIRED = 'true';
process.env.API_KEY = 'test-api-key-123456789012345678901234567890';

const app = require('../src/app');

function request(server, options = {}) {
    return new Promise((resolve, reject) => {
        const address = server.address();
        const req = http.request({
            hostname: '127.0.0.1',
            port: address.port,
            path: options.path || '/api/v1/pdf/extract',
            method: options.method || 'POST',
            headers: options.headers || {}
        }, res => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({
                status: res.statusCode,
                headers: res.headers,
                body: JSON.parse(body)
            }));
        });
        req.on('error', reject);
        req.end();
    });
}

test('bloqueia endpoint protegido sem API key', async () => {
    const server = app.listen(0);
    try {
        const response = await request(server);
        assert.equal(response.status, 401);
        assert.equal(response.body.success, false);
        assert.equal(response.body.errors[0].code, 'UNAUTHORIZED');
        assert.ok(response.headers['x-request-id']);
    } finally {
        server.close();
    }
});

test('permite health sem API key', async () => {
    const server = app.listen(0);
    try {
        const response = await request(server, {
            path: '/api/v1/health',
            method: 'GET'
        });
        assert.equal(response.status, 200);
        assert.equal(response.body.data.status, 'UP');
    } finally {
        server.close();
    }
});
