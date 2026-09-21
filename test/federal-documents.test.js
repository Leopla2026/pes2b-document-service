const test = require('node:test');
const assert = require('node:assert/strict');

const detector = require('../src/document/detectors/document.detector');
const registry = require('../src/document/parsers/registry');

function parse(text) {
  const detection = detector.detectDetailed(text);
  const definition = registry.getDefinition(detection.documentType);
  const parser = registry.getParser(detection.documentType);
  assert.ok(definition);
  assert.ok(parser);
  assert.ok(detection.confidence >= definition.minimumConfidence);
  return { detection, data: parser.parse(text) };
}

function darfText({ code, title, detail, values, pa, topPeriod = 'julho/2026', due = '25/08/2026' }) {
  return `Documento de Arrecadação de Receitas Federais
12.345.678/0001-90 EMPRESA EXEMPLO LTDA
Período de Apuração Data de Vencimento Número do Documento 07.16.26237.1158595-2
Pagar este documento até ${due}
Nº Recibo Declaração: 50000000000000 Valor Total do Documento ${values.at(-1)}
CNPJ Razão Social ${topPeriod} ${due}
Código Principal Denominação Total Multa Juros
Composição do Documento de Arrecadação
${code}${title} ${values.join('')} 01 ${detail} PA:${pa} Vencimento:${due}
Totais ${values.join('')}
SENDA (Versão:1.5.9) 25/08/2026 13:25:43 Pague com o PIX`;
}

test('DARF PIS cumulativo preserva código, regime e valor numérico', () => {
  const { detection, data } = parse(darfText({
    code: '8109',
    title: 'PIS - FATURAMENTO',
    detail: 'PIS - FATURAMENTO - PJ EM GERAL',
    values: ['12.845,37', '12.845,37'],
    pa: '07/2026'
  }));
  assert.equal(detection.documentType, 'DARF');
  assert.equal(data.tributos[0].tributo, 'PIS');
  assert.equal(data.tributos[0].regime, 'CUMULATIVO');
  assert.equal(data.tributos[0].principal, 12845.37);
});

test('DARF COFINS não cumulativa reconhece código sem criar documentType específico', () => {
  const { detection, data } = parse(darfText({
    code: '5856',
    title: 'COFINS NAO-CUMULATIVA',
    detail: 'COFINS - NÃO CUMULATIVA',
    values: ['18.554,22', '18.554,22'],
    pa: '07/2026'
  }));
  assert.equal(detection.documentType, 'DARF');
  assert.equal(data.tributos[0].tributo, 'COFINS');
  assert.equal(data.tributos[0].regime, 'NAO_CUMULATIVO');
});

test('DARF COFINS cumulativa reconhece o código 2172', () => {
  const { data } = parse(darfText({
    code: '2172',
    title: 'COFINS - CONTRIB P/ FIN. SEG. SOCIAL',
    detail: 'COFINS - FATURAMENTO/PJ EM GERAL',
    values: ['506,00', '506,00'],
    pa: '07/2026'
  }));
  assert.equal(data.tributos[0].tributo, 'COFINS');
  assert.equal(data.tributos[0].regime, 'CUMULATIVO');
});

test('DARF PIS não cumulativo reconhece o código 6912', () => {
  const { data } = parse(darfText({
    code: '6912',
    title: 'PIS - NAO-CUMULATIVO',
    detail: 'PIS - NÃO CUMULATIVO',
    values: ['4.125,10', '4.125,10'],
    pa: '07/2026'
  }));
  assert.equal(data.tributos[0].tributo, 'PIS');
  assert.equal(data.tributos[0].regime, 'NAO_CUMULATIVO');
});

test('DARF trimestral de lucro real deriva trimestre do PA e não do vencimento', () => {
  const { data } = parse(darfText({
    code: '3373',
    title: 'IRPJ - NAO OBR LUC REAL-BAL TRIM',
    detail: 'IRPJ - PJ OPTANTE PELO LUCRO REAL - APURAÇÃO TRIMESTRAL',
    values: ['780.526,72', '780.526,72'],
    pa: '01/2026',
    topPeriod: '31/03/2026',
    due: '30/04/2026'
  }));
  assert.equal(data.tributos[0].tributo, 'IRPJ');
  assert.equal(data.tributos[0].trimestre, 1);
  assert.equal(data.tributos[0].anoTrimestre, 2026);
});

test('DARF CSLL de lucro real preserva código 6012 e trimestre', () => {
  const { data } = parse(darfText({
    code: '6012',
    title: 'CSLL - DEMAIS PJ - BAL TRIMESTRAL',
    detail: 'CSLL - PJ OPTANTE PELO LUCRO REAL - APURAÇÃO TRIMESTRAL',
    values: ['210.430,00', '210.430,00'],
    pa: '01/2026',
    topPeriod: '31/03/2026',
    due: '30/04/2026'
  }));
  assert.equal(data.tributos[0].tributo, 'CSLL');
  assert.equal(data.tributos[0].codigoReceita, '6012');
  assert.equal(data.tributos[0].trimestre, 1);
});

test('DARF IRPJ de lucro presumido preserva código 2089 e trimestre', () => {
  const { data } = parse(darfText({
    code: '2089',
    title: 'IRPJ - LUCRO PRESUMIDO',
    detail: 'IRPJ - LUCRO PRESUMIDO - APURAÇÃO TRIMESTRAL',
    values: ['32.100,00', '32.100,00'],
    pa: '2º Trimestre/2026',
    topPeriod: 'junho/2026',
    due: '31/07/2026'
  }));
  assert.equal(data.tributos[0].tributo, 'IRPJ');
  assert.equal(data.tributos[0].codigoReceita, '2089');
  assert.equal(data.tributos[0].trimestre, 2);
});

test('DARF CSLL em quota preserva juros e não inventa número da quota', () => {
  const { data } = parse(darfText({
    code: '2372',
    title: 'CSLL - DEMAIS',
    detail: 'CSLL - LUCRO PRESUMIDO OU ARBITRADO - ENTIDADE',
    values: ['14.836,90', '148,36', '14.985,26'],
    pa: '2º Trimestre/2026',
    topPeriod: 'junho/2026',
    due: '31/08/2026'
  }));
  assert.equal(data.identificacao.competencia, '06/2026');
  assert.equal(data.tributos[0].trimestre, 2);
  assert.equal(data.tributos[0].juros, 148.36);
  assert.equal(data.parcelamento.possivelQuotaTrimestral, true);
  assert.equal(data.parcelamento.numeroQuota, null);
});

test('DARFs do mesmo trimestre em vencimentos distintos não alteram a competência tributária', () => {
  const base = {
    code: '2372',
    title: 'CSLL - DEMAIS',
    detail: 'CSLL - LUCRO PRESUMIDO OU ARBITRADO - ENTIDADE',
    pa: '2º Trimestre/2026',
    topPeriod: 'junho/2026'
  };
  const primeira = parse(darfText({ ...base, values: ['14.836,90', '14.836,90'], due: '31/07/2026' })).data;
  const segunda = parse(darfText({ ...base, values: ['14.836,90', '148,36', '14.985,26'], due: '31/08/2026' })).data;

  assert.equal(primeira.tributos[0].trimestre, 2);
  assert.equal(segunda.tributos[0].trimestre, 2);
  assert.equal(primeira.tributos[0].anoTrimestre, 2026);
  assert.equal(segunda.tributos[0].anoTrimestre, 2026);
  assert.equal(segunda.parcelamento.numeroQuota, null);
});

test('DARF unificado percorre todas as linhas da composição', () => {
  const text = `Documento de Arrecadação de Receitas Federais
12.345.678/0001-90 EMPRESA EXEMPLO LTDA Período de Apuração Data de Vencimento Número do Documento 07.16.26000.0000000-0
Pagar este documento até 25/08/2026 Valor Total do Documento 604,80 CNPJ Razão Social julho/2026 25/08/2026
Composição do Documento de Arrecadação
8109PIS - FATURAMENTO 98,8098,80 02 PIS - FATURAMENTO - PJ EM GERAL PA:07/2026 Vencimento:25/08/2026
2172COFINS - CONTRIB P/ FIN. SEG. SOCIAL 506,00506,00 01 COFINS - FATURAMENTO/PJ EM GERAL PA:07/2026 Vencimento:25/08/2026
Totais 604,80604,80`;
  const { data } = parse(text);
  assert.equal(data.tributos.length, 2);
  assert.equal(data.resumo.quantidadeTributos, 2);
  assert.equal(data.resumo.darfUnificado, true);
  assert.deepEqual(data.resumo.tributosIdentificados, ['PIS', 'COFINS']);
});

test('EFD-Contribuições extrai regimes simultâneos e transmissão', () => {
  const text = `APURAÇÃO DAS CONTRIBUIÇÕES SOCIAS PIS/PASEP COFINS
Valor Total da Contribuição Apurada R$ 0,00 R$ 37.476,00
Valor Total da Contribuição Apurada R$ 8.119,80 R$ 0,00
REGIME DE APURAÇÃO NÃO-CUMULATIVO REGIME DE APURAÇÃO CUMULATIVO
Valor Total do crédito disponível relativo ao período R$ 0,00 R$ 0,00
(-) Valor total dos créditos descontados R$ 0,00 R$ 0,00
(-) Valor total de retenções e outras deduções R$ 0,00 R$ 0,00
= Valor da contribuição Social a Recolher R$ 0,00 R$ 0,00
Saldo de créditos relativo ao período a utilizar em períodos futuros R$ 0,00 R$ 0,00
(-) Valor total de retenções e outras deduções R$ 0,00 R$ 0,00
= Valor da Contribuição Social a Recolher R$ 37.476,00 R$ 8.119,80
APURAÇÃO DA CONTRIBUIÇÃO PREVIDENCIARIA SOBRE RECEITAS
Valor Total da Contribuição Apurada sobre Receitas R$ 0,00
(+) Valor total dos ajustes de acréscimo R$ 0,00
(-) Valor total dos ajustes de redução R$ 0,00
Valor da Contribuição Previdenciária a Recolher R$ 0,00
10.000.000/0001-00 Número do Recibo: Assinatura da transmissão gerada pelo ReceitaNet:
24/08/2026 O presente recibo de entrega contém EFD-Contribuições
BC.2F.D1.23.E0.39.25.BC.F8.6B.6E.1C.A1.A0.19.54.2B.71.A8.19-0
43.6C.18.01.0B.8F.40.25.5D.0A.F0.9C.F5.B9.B5.EF
às 16:08:58 EMPRESA EXEMPLO LTDA. 12.345.678/0001-90 01/07/2026 a 31/07/2026 Original
Período de apuração: Contribuinte: CNPJ: IDENTIFICAÇÃO DA ESCRITURAÇÃO Tipo:
SISTEMA PÚBLICO DE ESCRITURAÇÃO DIGITAL - SPED
RECIBO DE ENTREGA DE ESCRITURAÇÃO FISCAL DIGITAL - CONTRIBUIÇÕES
Versão EFD-Contribuições: 6.1.2 Identificação do arquivo:ABCDEF0123456789 SCP:`;
  const { detection, data } = parse(text);
  assert.equal(detection.documentType, 'RECIBO_EFD_CONTRIBUICOES');
  assert.equal(data.identificacao.cnpj, '12.345.678/0001-90');
  assert.equal(data.identificacao.competencia, '07/2026');
  assert.equal(data.pis.cumulativo.valorRecolher, 8119.8);
  assert.equal(data.cofins.cumulativo.valorRecolher, 37476);
  assert.equal(data.transmissao.dataISO, '2026-08-24');
});

test('DCTFWeb percorre todos os débitos e consolida resumo', () => {
  const text = `RELATÓRIO DA DECLARAÇÃO COMPLETA - DCTFWeb
Nome do Contribuinte EMPRESA EXEMPLO LTDA CNPJ 12.345.678/0001-90 Período apuração 07/2026
Número do Recibo 50000000000000 Data/Hora da Transmissão 24/08/2026 21:30:27
Identificação da Apuração de Débitos 31171452 / MIT
Dados Iniciais Classificação Tributária 99-Pessoas Jurídicas em Geral Ausência de Fatos Geradores Não
Dados do Representante do Contribuinte e do Responsável pelo Preenchimento
Representante NOME EXEMPLO CPF 00000000000 Telefone 00000000 Correio Eletrônico -
Responsável pelo Preenchimento CONTADOR EXEMPLO CPF 11111111111 CRC 123456 UF RS Telefone 5100000000 Correio Eletrônico contador@example.com
Dados do MIT CRVM Regime de Caixa Qualificação PJ PJ em geral Levantou balanço e/ou balancete Não Forma de tributação Presumido
Débito Apurado e Crédito Vinculado Código da Receita 8109-02 Descrição PIS - FATURAMENTO - PJ EM GERAL
Período Apuração Débito 07/2026 Débito Apurado 19,79 Saldo a Pagar 19,79
Débito Apurado e Crédito Vinculado Código da Receita 2172-01 Descrição COFINS - FATURAMENTO/PJ EM GERAL
Período Apuração Débito 07/2026 Débito Apurado 91,35 Saldo a Pagar 91,35`;
  const { detection, data } = parse(text);
  assert.equal(detection.documentType, 'DCTFWEB');
  assert.equal(data.debitos.length, 2);
  assert.equal(data.resumo.valorTotalDebitos, 111.14);
  assert.deepEqual(data.resumo.tributosIdentificados, ['PIS', 'COFINS']);
  assert.equal(data.responsavelPreenchimento.email, 'contador@example.com');
});

test('registro federal é aditivo e mantém declaração de faturamento', () => {
  assert.ok(registry.getParser('DARF'));
  assert.ok(registry.getParser('RECIBO_EFD_CONTRIBUICOES'));
  assert.ok(registry.getParser('DCTFWEB'));
  assert.ok(registry.getParser('DECLARACAO_FATURAMENTO'));
  assert.equal(registry.validate().valid, true);
});
