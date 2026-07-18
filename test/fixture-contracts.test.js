const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const detector = require('../src/document/detectors/document.detector');
const registry = require('../src/document/parsers/registry');

function fixture(...parts) {
  return fs.readFileSync(
    path.join(__dirname, 'fixtures', 'simples', ...parts),
    'utf8'
  );
}

function detectarEInterpretar(relativePath) {
  const text = fixture(...relativePath);
  const detection = detector.detectDetailed(text);
  const definition = registry.getDefinition(detection.documentType);
  const parser = registry.getParser(detection.documentType);

  assert.ok(definition, `Parser não registrado para ${detection.documentType}`);
  assert.ok(parser, `Parser não encontrado para ${detection.documentType}`);
  assert.ok(
    detection.confidence >= definition.minimumConfidence,
    `Confiança ${detection.confidence} abaixo do mínimo ${definition.minimumConfidence}`
  );

  return {
    text,
    detection,
    data: parser.parse(text)
  };
}

test('fixture DAS: detecta e extrai campos essenciais', () => {
  const result = detectarEInterpretar(['das', 'valido.txt']);

  assert.equal(result.detection.documentType, 'DAS');
  assert.equal(result.detection.confidenceLevel, 'HIGH');
  assert.equal(result.data.identificacao.cnpj, '67.600.788/0001-48');
  assert.equal(result.data.identificacao.competencia, '06/2026');
  assert.equal(result.data.valores.valorDocumento, '108,00');
  assert.equal(result.data.datas.vencimento, '20/07/2026');
});

test('fixture declaração PGDAS retificadora: detecta e preserva versão', () => {
  const result = detectarEInterpretar(['declaracao', 'retificadora.txt']);

  assert.equal(result.detection.documentType, 'DECLARACAO_PGDAS');
  assert.equal(result.data.identificacao.competencia, '06/2026');
  assert.equal(result.data.documento.tipoDeclaracao, 'RETIFICADORA');
  assert.equal(result.data.documento.ehRetificadora, true);
  assert.equal(result.data.resumo.receitaBruta, '1.800,00');
  assert.equal(result.data.resumo.valorDebitoDeclarado, '108,00');
});

test('fixture recibo PGDAS retificadora: detecta e extrai valores', () => {
  const result = detectarEInterpretar(['recibo', 'retificadora.txt']);

  assert.equal(result.detection.documentType, 'RECIBO_PGDAS');
  assert.equal(result.data.identificacao.competencia, '06/2026');
  assert.equal(result.data.documento.ehRetificadora, true);
  assert.equal(result.data.valores.receitaBrutaNumero, 1800);
  assert.equal(result.data.valores.totalDebitoDeclaradoNumero, 108);
});

test('fixture extrato PGDAS: detecta e extrai metadados', () => {
  const result = detectarEInterpretar(['extrato', 'valido.txt']);

  assert.equal(result.detection.documentType, 'EXTRATO_PGDAS');
  assert.equal(result.data.identificacao.competencia, '06/2026');
  assert.equal(result.data.extrato.versao, '5.2.9');
  assert.equal(result.data.extrato.tipoApuracao, 'Retificadora');
});

test('fixture relatório Simples: detecta, interpreta e consolida anexo', () => {
  const result = detectarEInterpretar(['relatorio', 'valido.txt']);

  assert.equal(result.detection.documentType, 'RELATORIO_SIMPLES');
  assert.equal(result.data.identificacao.competencia, '06/2026');
  assert.equal(result.data.resumo.receitaBrutaMesNumero, '1800.00');
  assert.equal(result.data.resumo.valorSimplesRecolherNumero, '108.00');
  assert.equal(result.data.apuracoes.length, 1);
  assert.equal(result.data.consolidacaoPorAnexo[0].anexo, 'III');
});

test('fixture declaração de faturamento: detecta e confere 12 meses', () => {
  const result = detectarEInterpretar(['declaracao-faturamento', 'valida.txt']);

  assert.equal(result.detection.documentType, 'DECLARACAO_FATURAMENTO');
  assert.equal(result.data.identificacao.competencia, '06/2026');
  assert.equal(result.data.faturamento.quantidadeMeses, 12);
  assert.equal(result.data.faturamento.totalNumero, 12500);
  assert.equal(result.data.faturamento.totalConfere, true);
  assert.deepEqual(result.data.warnings, []);
});

test('fixture negativa: não classifica texto genérico como DAS', () => {
  const text = fixture('negativos', 'falso-das.txt');
  const result = detector.detectDetailed(text);

  assert.equal(result.documentType, 'UNKNOWN');
  assert.equal(result.confidence, 0);
});
