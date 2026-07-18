const test = require('node:test');
const assert = require('node:assert/strict');

const registry = require('../src/document/parsers/registry');

test('registry devolve metadados completos do parser DAS', () => {
  const definition = registry.getDefinition('DAS');

  assert.ok(definition);
  assert.equal(definition.documentType, 'DAS');
  assert.equal(definition.family, 'SIMPLES_NACIONAL');
  assert.equal(definition.parserName, 'das');
  assert.equal(definition.version, '1.0.0');
  assert.equal(definition.schemaVersion, '1.0');
  assert.equal(definition.status, 'active');
  assert.equal(typeof definition.parser.parse, 'function');
});

test('registry preserva acesso direto compatível com a versão anterior', () => {
  assert.equal(registry.DAS, registry.getParser('DAS'));
  assert.equal(typeof registry.DAS.parse, 'function');
});

test('registry lista metadados sem expor implementação por padrão', () => {
  const parsers = registry.list();

  assert.equal(parsers.length, 6);
  assert.ok(parsers.every(item => item.family === 'SIMPLES_NACIONAL'));
  assert.ok(parsers.every(item => item.status === 'active'));
  assert.ok(parsers.every(item => !Object.hasOwn(item, 'parser')));
});

test('registry valida todas as definições cadastradas', () => {
  const result = registry.validate();

  assert.equal(result.valid, true);
  assert.equal(result.count, 6);
  assert.deepEqual(result.errors, []);
});

test('registry retorna null para documento sem parser cadastrado', () => {
  assert.equal(registry.getDefinition('UNKNOWN'), null);
  assert.equal(registry.getParser('UNKNOWN'), null);
  assert.equal(registry.has('UNKNOWN'), false);
});
