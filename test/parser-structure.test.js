const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const registry = require('../src/document/parsers/registry');

const expectedFolders = [
  'das',
  'recibo',
  'declaracao',
  'extrato',
  'relatorio',
  'declaracao-faturamento'
];

test('cada parser possui pasta padronizada', () => {
  const base = path.join(
    __dirname,
    '..',
    'src',
    'document',
    'parsers',
    'simples'
  );

  for (const folder of expectedFolders) {
    for (const file of ['index.js', 'parser.js', 'schema.js', 'rules.js']) {
      assert.equal(
        fs.existsSync(path.join(base, folder, file)),
        true,
        `${folder}/${file} não encontrado`
      );
    }
  }
});

test('registry carrega schema e regras de cada parser', () => {
  for (const definition of registry.list({
    includeSchema: true,
    includeRules: true
  })) {
    assert.ok(definition.documentType);
    assert.ok(definition.schema);
    assert.ok(Array.isArray(definition.schema.required));
    assert.ok(definition.rules);
    assert.equal(
      definition.rules.documentType,
      definition.documentType
    );
  }
});

test('wrappers legados continuam compatíveis', () => {
  const dasLegacy = require(
    '../src/document/parsers/simples/das.parser'
  );
  const reciboLegacy = require(
    '../src/document/parsers/simples/recibo.pgdas.parser'
  );

  assert.equal(typeof dasLegacy.parse, 'function');
  assert.equal(typeof reciboLegacy.parse, 'function');
});
