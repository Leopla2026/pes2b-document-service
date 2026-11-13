const { first, cnpj } = require('../helpers');

const DOC = '\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}';
const MONTH = '(?:0[1-9]|1[0-2])/\\d{4}';
const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const plain = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

exports.parse = function parseReinfEnvios(text) {
  text = clean(text);
  const title = /RELAT[ÓO]RIO DE CONSULTA DO ENVIO DOS ARQUIVOS DA EFD-REINF/i;
  const headerEnd = text.search(/Empresa\s*Compet[êe]ncia\s*Inscri[çc][ãa]o/i);
  const header = headerEnd >= 0 ? text.slice(0, headerEnd) : text;
  const companyCnpj = cnpj(header);
  const company = first(header, /^([\s\S]*?)\s+CNPJ\s*:/i);
  const range = header.match(new RegExp(`Compet[êe]ncia\\s*:\\s*(${MONTH})\\s+a\\s+(${MONTH})`, 'i'));
  const rows = new RegExp(`(?:^|\\s)(\\d{1,6})\\s+-\\s+([\\s\\S]*?)(${MONTH})\\s*(${DOC})\\s*(Oficial|Produ[cç][aã]o|Teste|Homologa[cç][aã]o)\\s*(\\d{2}/\\d{2}/\\d{4})\\s*-\\s*(\\d{2}:\\d{2}(?::\\d{2})?)`, 'gi');
  const table = headerEnd >= 0 ? text.slice(headerEnd) : '';
  const footerAt = table.search(/Sistema licenciado para/i);
  const body = footerAt >= 0 ? table.slice(0, footerAt) : table;
  const matches = [...body.matchAll(rows)];
  const eventos = matches.map((match, index) => {
    const tail = body.slice(match.index + match[0].length, matches[index + 1]?.index ?? body.length).trim();
    const fields = tail.match(/^(?:(\d+(?:-\d+){4})\s*)?(Sucesso|Processando|Invalidado|Rejeitado|Erro|Pendente|Exclu[ií]do)\s*(Inclus[aã]o|Retifica[cç][aã]o|Fechamento|Reabertura|Exclus[aã]o|Altera[cç][aã]o)\s*(R-\d{4})\s*-\s*([\s\S]*)$/i);
    return {
      codigoDominio: match[1], empresa: clean(match[2]), competencia: match[3], cnpj: match[4],
      ambiente: match[5], dataEnvio: match[6], horaEnvio: match[7],
      numeroRecibo: fields?.[1] || null,
      situacao: fields ? plain(fields[2]) : 'NAO_RECONHECIDA',
      tipoEnvio: fields ? plain(fields[3]) : null,
      evento: fields?.[4]?.toUpperCase() || null,
      descricaoEvento: fields ? clean(fields[5]).replace(/\s+1$/, '') : null,
      leituraCompleta: Boolean(fields),
      textoOriginal: clean(match[0] + ' ' + tail)
    };
  });
  const competencias = [...new Set(eventos.map(e => e.competencia))];
  const documentos = [...new Set(eventos.map(e => e.cnpj))];
  const competencia = range && range[1] === range[2] ? range[1] : null;
  const motivos = [];
  const quantidadeLinhas = [...body.matchAll(new RegExp(DOC, 'g'))].length;
  if (!title.test(header) || headerEnd < 0) motivos.push('ESTRUTURA_RELATORIO_NAO_RECONHECIDA');
  if (!companyCnpj || !range) motivos.push('IDENTIFICACAO_OU_PERIODO_AUSENTE');
  if (!eventos.length) motivos.push('EVENTOS_NAO_IDENTIFICADOS');
  if (quantidadeLinhas !== eventos.length) motivos.push('LINHAS_NAO_INTERPRETADAS');
  if (eventos.some(e => !e.leituraCompleta)) motivos.push('EVENTO_NAO_INTERPRETADO');
  if (eventos.some(e => !['OFICIAL', 'PRODUCAO'].includes(plain(e.ambiente)))) motivos.push('AMBIENTE_NAO_OFICIAL');
  if (eventos.some(e => e.situacao === 'SUCESSO' && !e.numeroRecibo)) motivos.push('RECIBO_DE_SUCESSO_AUSENTE');
  if (documentos.some(value => value !== companyCnpj)) motivos.push('CNPJ_EVENTO_DIVERGE_DO_CABECALHO');
  if (!competencia || competencias.some(value => value !== competencia)) motivos.push('RELATORIO_COM_MULTIPLAS_COMPETENCIAS_OU_DIVERGENCIA');
  const count = status => eventos.filter(e => e.situacao === status).length;
  const emissao = header.match(/(\d{2}:\d{2}:\d{2})\s+(\d{2}\/\d{2}\/\d{4})/);
  const pendentes = eventos.filter(e => e.situacao !== 'SUCESSO');
  return {
    identificacao: { empresa: company, cnpj: companyCnpj, competencia },
    documento: { tipo: 'RELATORIO_EFD_REINF', origem: 'DOMINIO', finalidade: 'ARQUIVAMENTO', enviarAoCliente: false },
    periodo: { inicial: range?.[1] || null, final: range?.[2] || null, competenciasEventos: competencias },
    emissao: { data: emissao?.[2] || null, hora: emissao?.[1] || null },
    eventos,
    resumo: {
      quantidadeEventos: eventos.length,
      quantidadeLinhasIdentificadas: quantidadeLinhas,
      quantidadeSucesso: count('SUCESSO'), quantidadeProcessando: count('PROCESSANDO'),
      quantidadeInvalidado: count('INVALIDADO'), quantidadeRetificacoes: eventos.filter(e => e.tipoEnvio === 'RETIFICACAO').length,
      possuiPendencias: pendentes.length > 0,
      eventosPendentes: pendentes.map(e => ({ evento: e.evento, situacao: e.situacao })),
      // O relatório pode estar parcial, em processamento ou omitir o fechamento R-4099.
      situacaoDeclaracao: 'NAO_INFERIDA',
      requerAnalise: motivos.length > 0 || pendentes.length > 0,
      motivos
    }
  };
};
