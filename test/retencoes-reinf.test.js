const test = require('node:test');
const assert = require('node:assert/strict');
const detector = require('../src/document/detectors/document.detector');
const registry = require('../src/document/parsers/registry');

function parse(text) {
  const detection = detector.detectDetailed(text);
  const definition = registry.getDefinition(detection.documentType);
  assert.ok(definition, detection.documentType);
  assert.ok(detection.confidence >= definition.minimumConfidence);
  return { type: detection.documentType, data: definition.parser.parse(text) };
}

function darf(rows, total = '60,99', pa = '10/2026') {
  return `Documento de Arrecadação de Receitas Federais
12.345.678/0001-90 EMPRESA EXEMPLO LTDA Período de Apuração Data de Vencimento Número do Documento 07.16.26000.0000000-0
Pagar este documento até 19/11/2026 Valor Total do Documento ${total}
CNPJ Razão Social outubro/2026 19/11/2026 Composição do Documento de Arrecadação
${rows.map(r => `${r} PA:${pa} Vencimento:19/11/2026`).join(' ')}
Totais ${total} ${total} SENDA (Versão:1.8.0) 12/11/2026`;
}
const crf = '5952RET DE CONTRIBUICOES PAGT PJ A PJ DE DIR PRIV 12,3412,34 07 RET DE CONTRIBUICOES PAGT PJ A PJ DE DIR PRIV';
const inss = '1162CONTRIBUIÇÃO SUJEITA RETENÇÃO PREVIDENCIÁRIA 48,6548,65 01 CP PATRONAL - RETENÇÃO LEI 9.711/98';

function report(rows, start = '10/2026', end = start) {
  return `EMPRESA EXEMPLO LTDA CNPJ: Situação:Todos os arquivos
RELATÓRIO DE CONSULTA DO ENVIO DOS ARQUIVOS DA EFD-REINF
11:46:56 12/11/2026 1/1Página: Emissão: Hora: 12.345.678/0001-90
Competência:${start} a ${end} EmpresaCompetênciaInscriçãoAmbienteData/Hora envioNúmero do reciboSituaçãoTipo de envioEvento
${rows.join(' ')} Sistema licenciado para ESCRITORIO EXEMPLO LTDA`;
}
function row(event, state = 'Sucesso', type = 'Inclusão', receipt = '12345-03-2010-2610-12345', competence = '10/2026', cnpj = '12.345.678/0001-90') {
  return `1 154 - EMPRESA EXEMPLO LTDA${competence}${cnpj}Oficial 12/11/2026 - 11:46 ${receipt}${state}${type}${event} - Descrição do evento`;
}

test('DARF unificado contém CRF e INSS, preservando CNPJ principal e valores separados', () => {
  const { type, data } = parse(darf([crf, inss + ' CNPJ Prestador:98.765.432/0001-10']));
  assert.equal(type, 'DARF');
  assert.equal(data.identificacao.cnpj, '12.345.678/0001-90');
  assert.equal(data.tributos[1].cnpjPrestador, '98.765.432/0001-10');
  assert.equal(data.identificacao.competencia, '10/2026');
  assert.equal(data.tributos.length, 2);
  assert.deepEqual(data.retencoes.tributos, ['CRF', 'INSS']);
  assert.equal(data.retencoes.porTributo.CRF.principal, 12.34);
  assert.equal(data.retencoes.porTributo.INSS.principal, 48.65);
  assert.equal(data.retencoes.total, 60.99);
  assert.equal(data.retencoes.requerAnalise, false);
});

test('IRRF 8045 é reconhecido sem limitar retenção a serviços 1708', () => {
  const { data } = parse(darf(['8045IRRF - DEMAIS RENDIMENTOS 4.474,164.474,16 06 IRRF - DEMAIS RENDIMENTOS'], '4.474,16'));
  assert.equal(data.tributos[0].tributo, 'IRRF');
  assert.equal(data.retencoes.porTributo.IRRF.principal, 4474.16);
  assert.equal(data.retencoes.requerAnalise, false);
});

test('código separado da denominação por espaços também é lido', () => {
  const { data } = parse(darf([crf.replace('5952RET', '5952 RET'), inss.replace('1162CON', '1162 CON')]));
  assert.equal(data.tributos.length, 2);
  assert.equal(data.retencoes.total, 60.99);
});

test('PIS e CSLL próprios permanecem fora do grupo de retenções', () => {
  const { data } = parse(darf(['8109PIS - FATURAMENTO 10,0010,00 01 PIS - FATURAMENTO', '2372CSLL - DEMAIS 20,0020,00 01 CSLL - DEMAIS'], '30,00'));
  assert.deepEqual(data.tributos.map(r => r.tributo), ['PIS', 'CSLL']);
  assert.equal(data.retencoes.possuiRetencoes, false);
  assert.equal(data.retencoes.total, 0);
});

test('divergência de um centavo entre composição e guia requer análise', () => {
  const { data } = parse(darf([crf, inss], '61,00'));
  assert.ok(data.retencoes.motivos.includes('TOTAL_COMPOSICAO_DIVERGE_DO_CABECALHO'));
});

test('código desconhecido e descrição de retenção não é liberado silenciosamente', () => {
  const { data } = parse(darf(['9999IRRF - EXEMPLO 10,0010,00 01 IRRF - EXEMPLO'], '10,00'));
  assert.equal(data.retencoes.porTributo.IRRF.principal, 10);
  assert.ok(data.retencoes.motivos.includes('CODIGO_RETENCAO_REQUER_VALIDACAO'));
});

test('PA da retenção diferente do cabeçalho requer conferência', () => {
  const { data } = parse(darf([crf], '12,34', '09/2026'));
  assert.ok(data.retencoes.motivos.includes('COMPETENCIA_RETENCAO_DIVERGENTE_OU_AUSENTE'));
});

test('guia mista preserva tributos próprios e exige conferência para o envio de retenções', () => {
  const { data } = parse(darf([crf, '8109PIS - FATURAMENTO 10,0010,00 01 PIS - FATURAMENTO'], '22,34'));
  assert.equal(data.retencoes.total, 12.34);
  assert.equal(data.valores.total, 22.34);
  assert.equal(data.retencoes.guiaSomenteRetencoes, false);
  assert.ok(data.retencoes.motivos.includes('GUIA_CONTEM_TRIBUTOS_FORA_DAS_RETENCOES'));
});

test('retenções INSS de vários prestadores são somadas sem trocar o contribuinte', () => {
  const { data } = parse(darf([inss+' CNPJ Prestador:98.765.432/0001-10', inss+' CNPJ Prestador:11.222.333/0001-44'], '97,30'));
  assert.equal(data.tributos.length, 2);
  assert.equal(data.retencoes.porTributo.INSS.principal, 97.3);
  assert.equal(data.identificacao.cnpj, '12.345.678/0001-90');
});

test('Reinf lê recibos, situações e eventos sem confundir números com código Domínio', () => {
  const { type, data } = parse(report([
    row('R-2010'), row('R-2099', 'Processando', 'Fechamento', ''),
    row('R-4020'), row('R-4099', 'Processando', 'Fechamento', '')
  ]));
  assert.equal(type, 'RELATORIO_EFD_REINF');
  assert.equal(data.identificacao.competencia, '10/2026');
  assert.equal(data.eventos.length, 4);
  assert.ok(data.eventos.every(e => e.codigoDominio === '154' && e.leituraCompleta));
  assert.equal(data.eventos[0].numeroRecibo, '12345-03-2010-2610-12345');
  assert.equal(data.resumo.quantidadeSucesso, 2);
  assert.equal(data.resumo.quantidadeProcessando, 2);
  assert.equal(data.eventos[1].numeroRecibo, null);
  assert.equal(data.documento.enviarAoCliente, false);
  assert.equal(data.resumo.situacaoDeclaracao, 'NAO_INFERIDA');
});

test('Reinf preserva invalidado e retificação sem inferir fechamento completo', () => {
  const { data } = parse(report([row('R-1000', 'Invalidado', 'Inclusão', ''), row('R-4020', 'Sucesso', 'Retificação')]));
  assert.equal(data.resumo.quantidadeInvalidado, 1);
  assert.equal(data.resumo.quantidadeRetificacoes, 1);
  assert.equal(data.resumo.possuiPendencias, true);
  assert.equal(data.resumo.situacaoDeclaracao, 'NAO_INFERIDA');
});

test('relatório com apenas eventos de sucesso também não comprova conclusão da declaração', () => {
  const { data } = parse(report([row('R-4020', 'Sucesso', 'Retificação')]));
  assert.equal(data.resumo.possuiPendencias, false);
  assert.equal(data.resumo.situacaoDeclaracao, 'NAO_INFERIDA');
  assert.equal(data.documento.finalidade, 'ARQUIVAMENTO');
});

test('relatório multiempresa ou com competência divergente exige análise', () => {
  const { data } = parse(report([row('R-2010'), row('R-4020', 'Sucesso', 'Inclusão', '12345-03-4020-2610-12345', '11/2026', '98.765.432/0001-10')]));
  assert.ok(data.resumo.motivos.includes('CNPJ_EVENTO_DIVERGE_DO_CABECALHO'));
  assert.ok(data.resumo.motivos.includes('RELATORIO_COM_MULTIPLAS_COMPETENCIAS_OU_DIVERGENCIA'));
});

test('intervalo de competências não é atribuído automaticamente a um único mês', () => {
  const { data } = parse(report([row('R-2010')], '09/2026', '10/2026'));
  assert.equal(data.identificacao.competencia, null);
  assert.equal(data.resumo.requerAnalise, true);
});

test('evento com situação desconhecida conserva texto e exige análise', () => {
  const { data } = parse(report([row('R-2010', 'NovaSituacao')]));
  assert.equal(data.eventos.length, 1);
  assert.equal(data.eventos[0].situacao, 'NAO_RECONHECIDA');
  assert.ok(data.resumo.motivos.includes('EVENTO_NAO_INTERPRETADO'));
});

test('menção genérica à EFD-Reinf não é reconhecida como relatório de envio', () => {
  assert.equal(detector.detect('EFD-Reinf CNPJ:12.345.678/0001-90 Competência:10/2026 aviso'), 'UNKNOWN');
});

test('linha de ambiente desconhecido não é descartada silenciosamente', () => {
  const { data } = parse(report([row('R-2010'), row('R-4020').replace('Oficial','AmbienteNovo')]));
  assert.ok(data.resumo.motivos.includes('LINHAS_NAO_INTERPRETADAS'));
});

test('ambiente de testes ou sucesso sem recibo requer análise', () => {
  const { data } = parse(report([row('R-2010').replace('Oficial','Teste'), row('R-4020','Sucesso','Inclusão','')]));
  assert.ok(data.resumo.motivos.includes('AMBIENTE_NAO_OFICIAL'));
  assert.ok(data.resumo.motivos.includes('RECIBO_DE_SUCESSO_AUSENTE'));
});
