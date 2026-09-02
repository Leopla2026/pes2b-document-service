function normalizarEspacos(valor) {
  return String(valor || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizarCnpj(valor) {
  const numeros = String(valor || '')
    .replace(/\D/g, '');

  return numeros.length === 14
    ? numeros
    : null;
}

function numeroBr(valor) {
  if (valor === null || valor === undefined) {
    return null;
  }

  const texto = String(valor)
    .trim()
    .replace(/\./g, '')
    .replace(',', '.');

  const numero = Number(texto);

  return Number.isFinite(numero)
    ? numero
    : null;
}

function somarValores(valores) {
  const validos = valores.filter(
    valor => valor !== null
  );

  if (validos.length === 0) {
    return null;
  }

  return Number(
    validos.reduce(
      (total, valor) => total + valor,
      0
    ).toFixed(2)
  );
}

function extrairTodosValores(texto, regex) {
  const valores = [];

  for (const match of String(texto || '').matchAll(regex)) {
    const valor = numeroBr(match[1]);

    if (valor !== null) {
      valores.push(valor);
    }
  }

  return valores;
}

function extrairUltimoValor(texto, regex) {
  const valores = extrairTodosValores(
    texto,
    regex
  );

  if (valores.length === 0) {
    return null;
  }

  return valores[valores.length - 1];
}

function extrairBlocoDeclaracao(texto) {
  const conteudo = String(texto || '');

  const marcadoresFim = [
    /GUIA PARA PAGAMENTO DE ISSQN/i,
    /RECIBO DE ENTREGA\s*-\s*DECLARA[CÇ][AÃ]O MENSAL/i
  ];

  let fim = conteudo.length;

  for (const marcador of marcadoresFim) {
    const indice = conteudo.search(marcador);

    if (
      indice >= 0 &&
      indice < fim
    ) {
      fim = indice;
    }
  }

  return conteudo.slice(0, fim);
}

function extrairCnpj(texto) {
  const match = String(texto || '').match(
    /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/
  );

  if (!match) {
    return null;
  }

  return normalizarCnpj(match[0]);
}

function extrairInscricaoMunicipal(texto) {
  const conteudo = String(texto || '');

  const match = conteudo.match(
    /Identifica[cç][aã]o do Declarante[\s\S]{0,250}?(\d{6}-\d-\d)/i
  );

  if (!match) {
    return null;
  }

  return match[1];
}

function extrairRazaoSocial(texto) {
  const conteudo = String(texto || '');

  const indicePrefeitura = conteudo.search(
    /Prefeitura de Porto Alegre/i
  );

  if (indicePrefeitura < 0) {
    return null;
  }

  const blocoIdentificacao = conteudo.slice(
    0,
    indicePrefeitura
  );

  const match = blocoIdentificacao.match(
    /(\d{6}-\d-\d)\s*(.+)$/i
  );

  if (!match) {
    return null;
  }

  const razaoSocial = normalizarEspacos(
    match[2]
  );

  return razaoSocial || null;
}

function mesParaNumero(mes) {
  const meses = {
    JAN: 1,
    FEV: 2,
    MAR: 3,
    ABR: 4,
    MAI: 5,
    JUN: 6,
    JUL: 7,
    AGO: 8,
    SET: 9,
    OUT: 10,
    NOV: 11,
    DEZ: 12
  };

  const chave = String(mes || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .slice(0, 3);

  return meses[chave] || null;
}

function extrairCompetencia(texto) {
  const conteudo = String(texto || '');

  const match = conteudo.match(
    /Declara[cç][aã]o Mensal\s*-\s*ISSQN\s*([A-Za-zÀ-ÿ]{3})\/(\d{4})/i
  );

  if (!match) {
    return null;
  }

  const month = mesParaNumero(match[1]);
  const year = Number(match[2]);

  if (!month || !Number.isInteger(year)) {
    return null;
  }

  const reference =
    `${year}-${String(month).padStart(2, '0')}`;

  return {
    year,
    month,
    reference,
    display:
      `${String(month).padStart(2, '0')}/${year}`
  };
}

function extrairFinanceiroDeclaracao(texto) {
  const declaracao = extrairBlocoDeclaracao(
    texto
  );

  const servicesRevenue = somarValores(
    extrairTodosValores(
      declaracao,
      /Base de C[aá]lculo\s+Receita Bruta\s*(-?[\d.]+,\d{2})/gi
    )
  );

  const deductions = somarValores(
    extrairTodosValores(
      declaracao,
      /Dedu[cç][oõ]es Legais\s*(-?[\d.]+,\d{2})/gi
    )
  );

  const taxBase = somarValores(
    extrairTodosValores(
      declaracao,
      /Base de c[aá]lculo\s*(-?[\d.]+,\d{2})/gi
    )
  );

  const issOwn = somarValores(
    extrairTodosValores(
      declaracao,
      /Imposto de Responsabilidade Pr[oó]pria Total\s*(-?[\d.]+,\d{2})/gi
    )
  );

  const issWithheldSubstitution = somarValores(
    extrairTodosValores(
      declaracao,
      /Imposto retido por Substitui[cç][aã]o tribut[aá]ria\s*(-?[\d.]+,\d{2})/gi
    )
  );

  const issWithheldFromThirdParties = somarValores(
    extrairTodosValores(
      declaracao,
      /Imposto retido de contribuinte substitu[ií]do\s*(-?[\d.]+,\d{2})/gi
    )
  );

  const issSolidaryResponsibility = somarValores(
    extrairTodosValores(
      declaracao,
      /Imposto retido por Responsabilidade Solid[aá]ria\s*(-?[\d.]+,\d{2})/gi
    )
  );

  const issCpom = somarValores(
    extrairTodosValores(
      declaracao,
      /Imposto retido por falta de inscri[cç][aã]o no CPOM\s*(-?[\d.]+,\d{2})/gi
    )
  );

  const totalTaxDue = somarValores(
    extrairTodosValores(
      declaracao,
      /Total do imposto devido\s*(-?[\d.]+,\d{2})/gi
    )
  );

  const totalToCollect = extrairUltimoValor(
    declaracao,
    /Total Geral A Recolher\s*(-?[\d.]+,\d{2})/gi
  );

  return {
    servicesRevenue,
    deductions,
    taxBase,
    issOwn,
    issWithheldSubstitution,
    issWithheldFromThirdParties,
    issSolidaryResponsibility,
    issCpom,
    totalTaxDue,
    totalToCollect
  };
}

function extrairBlocoRecibo(texto) {
  const conteudo = String(texto || '');

  const match = conteudo.match(
    /RECIBO DE ENTREGA\s*-\s*DECLARA[CÇ][AÃ]O MENSAL([\s\S]*)$/i
  );

  if (!match) {
    return null;
  }

  return match[0];
}

function extrairSubmittedAtRecibo(texto) {
  const bloco = extrairBlocoRecibo(texto);

  if (!bloco) {
    return null;
  }

  const match = bloco.match(
    /(\d{2})\/(\d{2})\/(\d{4})\s+[àa]s\s+(\d{2}):(\d{2}):(\d{2})/i
  );

  if (!match) {
    return null;
  }

  const [, dia, mes, ano, hora, minuto, segundo] = match;

  return (
    `${ano}-${mes}-${dia}` +
    `T${hora}:${minuto}:${segundo}-03:00`
  );
}

function extrairAutenticacaoRecibo(texto) {
  const bloco = extrairBlocoRecibo(texto);

  if (!bloco) {
    return null;
  }

  const match = bloco.match(
    /AUTENTICA[CÇ][AÃ]O\s+((?:[0-9A-F]{2}\s+){15}[0-9A-F]{2})/i
  );

  if (!match) {
    return null;
  }

  return normalizarEspacos(
    match[1].toUpperCase()
  );
}

function extrairRecibo(texto) {
  const bloco = extrairBlocoRecibo(texto);

  if (!bloco) {
    return null;
  }

  const recebido = /DECLARA[CÇ][AÃ]O RECEBIDA EM/i.test(
    bloco
  );

  return {
    status: recebido
      ? 'ENTREGUE'
      : null,

    submittedAt:
      extrairSubmittedAtRecibo(texto),

    authentication:
      extrairAutenticacaoRecibo(texto)
  };
}

function extrairBlocoGuia(texto) {
  const conteudo = String(texto || '');

  const inicio = conteudo.search(
    /GUIA PARA PAGAMENTO DE ISSQN/i
  );

  if (inicio < 0) {
    return null;
  }

  const trecho = conteudo.slice(inicio);

  const fim = trecho.search(
    /RECIBO DE ENTREGA\s*-\s*DECLARA[CÇ][AÃ]O MENSAL/i
  );

  if (fim >= 0) {
    return trecho.slice(0, fim);
  }

  return trecho;
}

function extrairCodigoArrecadacaoGuia(texto) {
  const bloco = extrairBlocoGuia(texto);

  if (!bloco) {
    return null;
  }

  /*
   * No texto extraído pelo pdf-parse, o código de arrecadação
   * pode ficar colado à inscrição municipal.
   *
   * Exemplo:
   * 328300332127217332127-2-4
   *
   * Por isso usamos como âncora o trecho "DOSEQ", que aparece
   * imediatamente antes da primeira ocorrência do código.
   */
  const match = bloco.match(
    /DOSEQ\s*(3283\d{11})/i
  );

  if (!match) {
    return null;
  }

  return match[1];
}

function extrairVencimentoGuia(texto) {
  const bloco = extrairBlocoGuia(texto);

  if (!bloco) {
    return null;
  }

  const match = bloco.match(
    /At[eé]\s+(\d{2})\/(\d{2})\/(\d{4})/i
  );

  if (!match) {
    return null;
  }

  const [, dia, mes, ano] = match;

  return `${ano}-${mes}-${dia}`;
}

function extrairGeracaoGuia(texto) {
  const bloco = extrairBlocoGuia(texto);

  if (!bloco) {
    return null;
  }

  const match = bloco.match(
    /ISSQN-e\s+(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/i
  );

  if (!match) {
    return null;
  }

  const [, dia, mes, ano, hora, minuto] = match;

  return (
    `${ano}-${mes}-${dia}` +
    `T${hora}:${minuto}:00-03:00`
  );
}

function extrairCodigoBarrasGuia(texto) {
  const bloco = extrairBlocoGuia(texto);

  if (!bloco) {
    return null;
  }

  const match = bloco.match(
    /\b(\d{12})\s+(\d{12})\s+(\d{12})\s+(\d{12})\b/
  );

  if (!match) {
    return null;
  }

  return [
    match[1],
    match[2],
    match[3],
    match[4]
  ].join(' ');
}

function extrairValorImpostoGuia(texto) {
  const bloco = extrairBlocoGuia(texto);

  if (!bloco) {
    return null;
  }

  const match = bloco.match(
    /IMPOSTO:\s*R\$\s*(-?[\d.]+,\d{2})/i
  );

  if (!match) {
    return null;
  }

  return numeroBr(match[1]);
}

function extrairValorPagarGuia(texto) {
  const bloco = extrairBlocoGuia(texto);

  if (!bloco) {
    return null;
  }

  const match = bloco.match(
    /N[AÃ]O RECEBER ESTA GUIA AP[OÓ]S\s+\d{2}\/\d{2}\/\d{4}\s+Declara[cç][aã]o Mensal\s+[A-Za-zÀ-ÿ]{3}\/\d{4}\s+R\$\s*([\d.]+,\d{2})/i
  );

  if (!match) {
    return null;
  }

  return numeroBr(match[1]);
}

function extrairReceitaBrutaGuia(texto) {
  const bloco = extrairBlocoGuia(texto);

  if (!bloco) {
    return null;
  }

  const match = bloco.match(
    /IMPORTANTE\s+R\$\s*([\d.]+,\d{2})\s*R\$/i
  );

  if (!match) {
    return null;
  }

  return numeroBr(match[1]);
}

function extrairGuia(texto) {
  const bloco = extrairBlocoGuia(texto);

  if (!bloco) {
    return null;
  }

  return {
    present: true,
    collectionCode:
      extrairCodigoArrecadacaoGuia(texto),
    dueDate:
      extrairVencimentoGuia(texto),
    generatedAt:
      extrairGeracaoGuia(texto),
    barcode:
      extrairCodigoBarrasGuia(texto),
    taxAmount:
      extrairValorImpostoGuia(texto),
    amountToPay:
      extrairValorPagarGuia(texto),
    revenue:
      extrairReceitaBrutaGuia(texto)
  };
}

function parse(texto) {
  return {
    company: {
      cnpj: extrairCnpj(texto),
      razaoSocial: extrairRazaoSocial(texto),
      inscricaoMunicipal:
        extrairInscricaoMunicipal(texto)
    },

    competence:
      extrairCompetencia(texto),

    financial:
      extrairFinanceiroDeclaracao(texto),

    receipt:
      extrairRecibo(texto),

    guide:
      extrairGuia(texto)
  };
}

module.exports = {
  parse,
  extrairCnpj,
  extrairRazaoSocial,
  extrairInscricaoMunicipal,
  extrairCompetencia,
  extrairBlocoDeclaracao,
  extrairFinanceiroDeclaracao,
  extrairBlocoRecibo,
  extrairSubmittedAtRecibo,
  extrairAutenticacaoRecibo,
  extrairRecibo,
  extrairBlocoGuia,
  extrairCodigoArrecadacaoGuia,
  extrairVencimentoGuia,
  extrairGeracaoGuia,
  extrairCodigoBarrasGuia,
  extrairValorImpostoGuia,
  extrairValorPagarGuia,
  extrairReceitaBrutaGuia,
  extrairGuia
};