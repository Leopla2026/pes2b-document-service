const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

process.env.API_KEY_REQUIRED = 'true';
process.env.API_KEY = 'efd-auxiliary-test-api-key-1234567890';

const parser = require('../src/document/parsers/federal/efd-contribuicoes-auxiliary.parser');
const app = require('../src/app');

const TXT_PATH = process.env.EFD_AUX_TXT_FIXTURE;
const REC_PATH = process.env.EFD_AUX_REC_FIXTURE;

test('TXT EFD-Contribuições extrai registro 0000 e calcula MD5 dos bytes originais', () => {
  const buffer = Buffer.from(
    '|0000|006|0|||01072026|31072026|EMPRESA EXEMPLO LTDA|40799826000187|RS|4306403||00|9|\r\n',
    'latin1'
  );
  const result = parser.parseTxt(buffer);

  assert.equal(result.tipoArquivo, 'EFD_CONTRIBUICOES_TXT');
  assert.equal(result.cnpj, '40799826000187');
  assert.equal(result.empresa, 'EMPRESA EXEMPLO LTDA');
  assert.equal(result.dataInicial, '2026-07-01');
  assert.equal(result.dataFinal, '2026-07-31');
  assert.equal(result.competencia, '07/2026');
  assert.match(result.md5, /^[A-F0-9]{32}$/);
  assert.equal(result.faturamento.encontrado, false);
  assert.equal(result.faturamento.total, null);
});

test('REC RCP01 extrai somente campos objetivos', () => {
  const rec = Buffer.from(
    'RCP014079982600018724082026212814ABCDEF123456        0745F7FCBECBA8BCBBA7D02C216BCA55        IDENTIFICADOR2\r\n',
    'ascii'
  );
  const result = parser.parseRec(rec);

  assert.equal(result.tipoArquivo, 'EFD_CONTRIBUICOES_REC');
  assert.equal(result.formato, 'RCP01');
  assert.equal(result.cnpj, '40799826000187');
  assert.equal(result.dataHora, '2026-08-24T21:28:14');
  assert.equal(result.md5TxtReferenciado, '0745F7FCBECBA8BCBBA7D02C216BCA55');
  assert.equal(result.identificadorTecnico1, 'ABCDEF123456');
  assert.equal(result.identificadorTecnico2, 'IDENTIFICADOR2');
});

test('endpoint recebe um TXT por multipart sem alterar endpoints existentes', async () => {
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));

  try {
    const form = new FormData();
    form.append('file', new Blob([
      '|0000|006|0|||01072026|31072026|EMPRESA EXEMPLO LTDA|40799826000187|RS|4306403||00|9|\r\n'
    ]), 'sped.txt');

    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/v1/efd-contribuicoes/auxiliary/parse`,
      { method: 'POST', headers: { 'X-API-Key': process.env.API_KEY }, body: form }
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.tipoArquivo, 'EFD_CONTRIBUICOES_TXT');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('arquivos reais TXT e REC possuem o mesmo MD5', {
  skip: !TXT_PATH || !REC_PATH
}, () => {
  const txt = parser.parseTxt(fs.readFileSync(TXT_PATH));
  const rec = parser.parseRec(fs.readFileSync(REC_PATH));

  assert.equal(txt.cnpj, '40799826000187');
  assert.equal(txt.competencia, '07/2026');
  assert.equal(txt.md5, '0745F7FCBECBA8BCBBA7D02C216BCA55');
  assert.equal(txt.faturamento.regime.codigoIncidenciaTributaria, '2');
  assert.equal(txt.faturamento.regime.tipoContribuicaoApurada, '1');
  assert.equal(txt.faturamento.fontePrincipal, 'F500');
  assert.equal(txt.faturamento.total, 3045);
  assert.equal(txt.faturamento.cumulativo, 3045);
  assert.equal(txt.faturamento.naoCumulativo, 0);
  assert.equal(txt.faturamento.receitaTributadaAliquotaBasica, 3045);
  assert.equal(txt.faturamento.receitaFinanceiraExcluidaFaturamento, null);
  assert.equal(txt.faturamento.faturamentoDeclarado0111, null);
  assert.equal(txt.faturamento.faturamentoCalculadoDetalhamento, 3045);
  assert.equal(txt.faturamento.diferenca, null);
  assert.equal(txt.faturamento.confere, null);
  assert.deepEqual(txt.faturamento.registrosUtilizados, ['0110', 'F500']);
  assert.equal(txt.faturamento.origens.length, 1);
  assert.equal(txt.faturamento.origens[0].valor, 3045);
  assert.equal(rec.formato, 'RCP01');
  assert.equal(rec.dataHora, '2026-08-24T21:28:14');
  assert.equal(rec.md5TxtReferenciado, txt.md5);
});
