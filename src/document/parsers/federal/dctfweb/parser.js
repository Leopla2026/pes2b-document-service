const { first, money, isoDate, cnpj, taxFrom, booleanPt } = require('../helpers');

function between(text, start, end) {
  const startIndex = text.search(start);
  if (startIndex < 0) return '';
  const rest = text.slice(startIndex);
  const endMatch = rest.match(end);
  return endMatch ? rest.slice(0, endMatch.index) : rest;
}

function parseDebits(text) {
  return text.split(/Débito Apurado e Crédito Vinculado/i).slice(1).map(block => {
    const code = first(block, /Código da Receita\s*([\d-]+)/i);
    if (!code) return null;
    const description = first(block, /Descrição\s*([\s\S]*?)\s*Período Apuração/i);
    const period = first(block, /Período Apuração\s*Débito\s*(\d{2}\/\d{4})/i)
      || first(block, /Período Apuração\s*(\d{2}\/\d{4})/i);
    return {
      codigoReceita: code,
      tributo: taxFrom(description),
      descricao: description,
      periodoApuracao: period,
      debitoApurado: money(first(block, /Débito Apurado\s*([\d.,]+)/i)),
      saldoPagar: money(first(block, /Saldo a Pagar\s*([\d.,]+)/i))
    };
  }).filter(Boolean);
}

exports.parse = function parseDctfweb(text) {
  const header = between(text, /Nome do Contribuinte/i, /Dados Iniciais/i);
  const people = between(text, /Dados do Representante/i, /Dados do MIT/i);
  const responsibleMarker = people.lastIndexOf('Responsável pelo Preenchimento');
  const representativeBlock = responsibleMarker >= 0 ? people.slice(0, responsibleMarker) : people;
  const responsibleBlock = responsibleMarker >= 0 ? people.slice(responsibleMarker) : '';
  const representativeName = first(
    text,
    /Dados do Representante do Contribuinte e do Responsável pelo Preenchimento\s+Representante\s+([A-ZÀ-Ü][A-ZÀ-Ü\s]+?)\s+CPF/i
  );
  const mitBlock = between(text, /Dados do MIT/i, /Débito Apurado e Crédito Vinculado/i);
  const competence = first(header, /Período apuração\s*(\d{2}\/\d{4})/i);
  const transmission = first(header, /Data\/Hora da\s*Transmissão\s*(\d{2}\/\d{2}\/\d{4})\s+\d{2}:\d{2}:\d{2}/i);
  const taxClassification = first(text, /Classificação Tributária\s*([^\s][\s\S]*?)\s*Missão Diplomática/i);
  const classificationMatch = taxClassification?.match(/^(\d+)\s*-\s*(.*)$/);
  const debitos = parseDebits(text);
  const identifiedTaxes = [...new Set(debitos.map(item => item.tributo))];

  return {
    identificacao: {
      empresa: first(header, /Nome do Contribuinte\s*([\s\S]*?)\s*CNPJ/i),
      cnpj: cnpj(header),
      competencia: competence
    },
    declaracao: {
      periodoApuracao: competence,
      numeroRecibo: first(header, /Número do Recibo\s*(\d+)/i),
      dataTransmissao: transmission,
      dataTransmissaoISO: isoDate(transmission),
      identificacaoApuracaoDebitos: first(header, /Identificação da\s*Apuração de Débitos\s*([^\s]+(?:\s*\/\s*[^\s]+)?)/i),
      origemApuracao: first(header, /Identificação da\s*Apuração de Débitos\s*\d+\s*\/\s*([^\s]+)/i),
      numeroReciboDeclaracaoRetificada: first(text, /Número do Recibo da Declaração Retificada\s*(\d+)/i),
      ausenciaFatosGeradores: booleanPt(first(text, /Ausência de Fatos Geradores\s*(Sim|Não)/i))
    },
    dadosIniciais: {
      classificacaoTributariaCodigo: classificationMatch?.[1] || null,
      classificacaoTributariaDescricao: classificationMatch?.[2]?.trim() || taxClassification
    },
    mit: {
      crvm: first(mitBlock, /CRVM\s*([\s\S]*?)\s*Qualificação PJ/i),
      qualificacaoPJ: first(mitBlock, /Qualificação PJ\s*([\s\S]*?)\s*Levantou balanço/i),
      levantouBalancoBalancete: booleanPt(first(mitBlock, /Levantou balanço e\/ou\s*balancete\s*(Sim|Não)/i)),
      formaTributacao: first(mitBlock, /Forma de tributação\s*([\s\S]*?)$/i)
    },
    representante: {
      nome: representativeName,
      cpf: first(representativeBlock, /CPF\s*(\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})/i)
    },
    responsavelPreenchimento: {
      nome: first(responsibleBlock, /Responsável pelo\s*Preenchimento\s*([\s\S]*?)\s*CPF/i),
      cpf: first(responsibleBlock, /CPF\s*(\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})/i),
      crc: first(responsibleBlock, /CRC\s*([A-Z0-9./-]+)/i),
      uf: first(responsibleBlock, /\bUF\s*([A-Z]{2})/i),
      telefone: first(responsibleBlock, /Telefone\s*(\d+)/i),
      email: first(responsibleBlock, /Correio Eletrônico\s*([^\s]+@[^\s]+)/i)
    },
    debitos,
    resumo: {
      quantidadeDebitos: debitos.length,
      valorTotalDebitos: Number(debitos.reduce((sum, item) => sum + (item.debitoApurado || 0), 0).toFixed(2)),
      valorTotalSaldoPagar: Number(debitos.reduce((sum, item) => sum + (item.saldoPagar || 0), 0).toFixed(2)),
      tributosIdentificados: identifiedTaxes
    }
  };
};
