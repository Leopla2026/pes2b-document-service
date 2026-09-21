const {
  first,
  money,
  isoDate,
  competenceFromRange,
  cnpj
} = require('../helpers');

function amounts(value) {
  return [...String(value || '').matchAll(/R\$\s*([\d.,]+)/g)].map(match => money(match[1]));
}

function rowPair(text, label, occurrence = 0) {
  const regex = new RegExp(`${label}\\s*R\\$\\s*([\\d.,]+)\\s*R\\$\\s*([\\d.,]+)`, 'gi');
  const matches = [...text.matchAll(regex)];
  return matches[occurrence] ? [money(matches[occurrence][1]), money(matches[occurrence][2])] : [null, null];
}

exports.parse = function parseEfd(text) {
  const start = first(text, /Período de apuração:\s*(\d{2}\/\d{2}\/\d{4})\s*a\s*\d{2}\/\d{2}\/\d{4}/i)
    || first(text, /(\d{2}\/\d{2}\/\d{4})\s*a\s*\d{2}\/\d{2}\/\d{4}/i);
  const end = first(text, /\d{2}\/\d{2}\/\d{4}\s*a\s*(\d{2}\/\d{2}\/\d{4})/i);
  const identification = first(text, /Identificação do arquivo:\s*([A-F0-9]+)/i);
  const contributionValues = amounts(first(text, /APURAÇÃO DAS CONTRIBUIÇÕES SOCIAS([\s\S]*?)REGIME DE APURAÇÃO NÃO-CUMULATIVO/i));
  const cprbBlock = first(text, /APURAÇÃO DA CONTRIBUIÇÃO PREVIDENCIARIA SOBRE RECEITAS([\s\S]*?)O presente recibo/i) || '';

  const credit = rowPair(text, 'Valor Total do crédito disponível relativo ao período');
  const discounted = rowPair(text, '\\(-\\) Valor total dos créditos descontados');
  const retainedNonCum = rowPair(text, '\\(-\\) Valor total de retenções e outras deduções', 0);
  const collectNonCum = rowPair(text, '= Valor da contribuição Social a Recolher', 0);
  const future = rowPair(text, 'Saldo de créditos relativo ao período a utilizar em períodos futuros');
  const retainedCum = rowPair(text, '\\(-\\) Valor total de retenções e outras deduções', 1);
  const collectCumRaw = rowPair(text, '= Valor da Contribuição Social a Recolher', 1);
  const collectCum = [collectCumRaw[1], collectCumRaw[0]];
  const pisNonCumContribution = contributionValues[0] ?? null;
  const cofinsCumContribution = contributionValues[1] ?? collectCum[1];
  const pisCumContribution = contributionValues[2] ?? collectCum[0];
  const cofinsNonCumContribution = contributionValues[3] ?? null;

  const companyIdentity = text.match(/([A-ZÀ-Ü][A-ZÀ-Ü0-9 .&'-]+?)\s+(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})\s+(\d{2}\/\d{2}\/\d{4})\s+a\s+(\d{2}\/\d{2}\/\d{4})\s+(Original|Retificadora)/i);
  const hashText = text
    .replace(/\s+\./g, '.')
    .replace(/([A-F0-9]{2})\s+(?=[A-F0-9]{2}\.)/gi, '$1.');
  const hashes = [...hashText.matchAll(/(?:[A-F0-9]{2}\.){8,}[A-F0-9]{1,2}(?:-[0-9])?/gi)].map(match => match[0].replace(/\s/g, ''));
  const dates = [...text.matchAll(/\b\d{2}\/\d{2}\/\d{4}\b/g)].map(match => match[0]);
  const transmissionDate = dates.find(value => value !== start && value !== end) || null;

  return {
    identificacao: {
      empresa: companyIdentity?.[1]?.trim() || null,
      cnpj: companyIdentity?.[2] || cnpj(text),
      competencia: competenceFromRange(start, end)
    },
    escrituracao: {
      tipo: companyIdentity?.[5]?.toUpperCase() || null,
      versaoEfd: first(text, /Versão EFD-Contribuições:\s*([\d.]+)/i),
      identificacaoArquivo: identification,
      periodoInicio: start,
      periodoInicioISO: isoDate(start),
      periodoFim: end,
      periodoFimISO: isoDate(end),
      scp: null
    },
    pis: {
      naoCumulativo: {
        creditoDisponivel: credit[0],
        contribuicaoApurada: pisNonCumContribution,
        creditosDescontados: discounted[0],
        retencoesOutrasDeducoes: retainedNonCum[0],
        valorRecolher: collectNonCum[0],
        saldoCreditosFuturos: future[0]
      },
      cumulativo: {
        contribuicaoApurada: pisCumContribution,
        retencoesOutrasDeducoes: retainedCum[0],
        valorRecolher: collectCum[0]
      }
    },
    cofins: {
      naoCumulativo: {
        creditoDisponivel: credit[1],
        contribuicaoApurada: cofinsNonCumContribution,
        creditosDescontados: discounted[1],
        retencoesOutrasDeducoes: retainedNonCum[1],
        valorRecolher: collectNonCum[1],
        saldoCreditosFuturos: future[1]
      },
      cumulativo: {
        contribuicaoApurada: cofinsCumContribution,
        retencoesOutrasDeducoes: retainedCum[1],
        valorRecolher: collectCum[1]
      }
    },
    cprb: {
      contribuicaoApurada: money(first(text, /Valor Total da Contribuição Apurada sobre Receitas\s*R\$\s*([\d.,]+)/i)),
      ajustesAcrescimo: money(first(cprbBlock, /ajustes de acréscimo\s*R\$\s*([\d.,]+)/i)),
      ajustesReducao: money(first(cprbBlock, /ajustes de redução\s*R\$\s*([\d.,]+)/i)),
      valorRecolher: money(first(cprbBlock, /Contribuição Previdenciária a Recolher\s*R\$\s*([\d.,]+)/i))
    },
    transmissao: {
      data: transmissionDate,
      dataISO: isoDate(transmissionDate),
      hora: first(text, /às\s*(\d{2}:\d{2}:\d{2})/i),
      numeroRecibo: hashes[0] || null,
      assinaturaReceitaNet: hashes[1] || null,
      certificadoNI: cnpj(text),
      certificadoCPF: first(text, /CPF:\s*([\d.-]+)/i)
    }
  };
};
