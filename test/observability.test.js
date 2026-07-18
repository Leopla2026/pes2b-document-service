const test = require('node:test');
const assert = require('node:assert/strict');

const logger = require('../src/utils/logger');

function captureConsole(method, fn) {
    const original = console[method];
    const lines = [];
    console[method] = (line) => lines.push(line);

    try {
        fn();
    } finally {
        console[method] = original;
    }

    return lines;
}

test('logger emite JSON estruturado com requestId e evento', () => {
    const lines = captureConsole('log', () => {
        logger.info('document_processed', {
            requestId: 'teste-observabilidade',
            documentType: 'DAS',
            durationMs: 12.34
        });
    });

    assert.equal(lines.length, 1);

    const payload = JSON.parse(lines[0]);
    assert.equal(payload.level, 'info');
    assert.equal(payload.event, 'document_processed');
    assert.equal(payload.requestId, 'teste-observabilidade');
    assert.equal(payload.documentType, 'DAS');
    assert.equal(payload.durationMs, 12.34);
    assert.ok(payload.timestamp);
});

test('logger normaliza erros sem perder codigo', () => {
    const error = new Error('Falha controlada');
    error.code = 'TEST_ERROR';

    const normalized = logger.normalizeError(error);

    assert.equal(normalized.name, 'Error');
    assert.equal(normalized.message, 'Falha controlada');
    assert.equal(normalized.code, 'TEST_ERROR');
});
