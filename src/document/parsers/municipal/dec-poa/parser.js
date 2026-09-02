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

  /*
   * Trabalhamos somente com o trecho anterior à primeira
   * ocorrência de "Prefeitura de Porto Alegre".
   *
   * No PDF extraído pela biblioteca, a inscrição municipal
   * pode ficar colada ao início da razão social, por exemplo:
   *
   * 256657-2-34 LEDS COMPONENTES ELÉTRICOS LTDA.
   *
   * Por isso não exigimos espaço depois da inscrição.
   */
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
    display: `${String(month).padStart(2, '0')}/${year}`
  };
}

function parse(texto) {
  return {
    company: {
      cnpj: extrairCnpj(texto),
      razaoSocial: extrairRazaoSocial(texto),
      inscricaoMunicipal: extrairInscricaoMunicipal(texto)
    },
    competence: extrairCompetencia(texto)
  };
}

module.exports = {
  parse,
  extrairCnpj,
  extrairRazaoSocial,
  extrairInscricaoMunicipal,
  extrairCompetencia
};