const FAMILY = 'SIMPLES_NACIONAL';

function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function avaliarRegra(normalized, regra) {
  const matchedRules = regra.all.filter(token =>
    normalized.includes(token)
  );

  const todosObrigatorios =
    matchedRules.length === regra.all.length;

  const algumAlternativo =
    !regra.any ||
    regra.any.length === 0 ||
    regra.any.some(token => normalized.includes(token));

  const nenhumExcludente =
    !regra.none ||
    regra.none.every(token => !normalized.includes(token));

  if (!todosObrigatorios || !algumAlternativo || !nenhumExcludente) {
    return null;
  }

  const alternativeMatches = (regra.any || []).filter(token =>
    normalized.includes(token)
  );

  return {
    documentType: regra.documentType,
    family: FAMILY,
    confidence: regra.confidence,
    matchedRules: [...matchedRules, ...alternativeMatches],
    detector: 'simples.detector'
  };
}

const regras = [
  {
    documentType: 'RELATORIO_SIMPLES',
    confidence: 1,
    all: [
      'SIMPLES NACIONAL',
      'TOTAL DE RECEITAS BRUTAS',
      'RECEITA BRUTA DO PERIODO DE APURACAO',
      'SIMPLES NACIONAL A RECOLHER',
      'SISTEMA LICENCIADO PARA'
    ]
  },
  {
    documentType: 'COMBINADO_DECLARACAO_RECIBO_PGDAS',
    confidence: 1,
    all: [
      'PROGRAMA GERADOR DO DOCUMENTO DE ARRECADACAO',
      'DECLARATORIO',
      'N DA DECLARACAO',
      'RECIBO DE ENTREGA DA APURACAO NO PGDAS-D'
    ]
  },
  {
    documentType: 'DECLARACAO_FATURAMENTO',
    confidence: 0.99,
    all: [
      'DECLARAMOS PARA OS DEVIDOS FINS',
      'TEVE COMO FATURAMENTO NO PERIODO',
      'CADASTRO NACIONAL DA PESSOA JURIDICA',
      'CRC',
      'TOTAL'
    ]
  },
  {
    documentType: 'RECIBO_PGDAS',
    confidence: 1,
    all: [
      'RECIBO DE ENTREGA DA APURACAO NO PGDAS-D'
    ]
  },
  {
    documentType: 'EXTRATO_PGDAS',
    confidence: 1,
    all: [
      'EXTRATO DO SIMPLES NACIONAL'
    ]
  },
  {
    documentType: 'DECLARACAO_PGDAS',
    confidence: 0.99,
    all: [
      'PROGRAMA GERADOR DO DOCUMENTO DE ARRECADACAO',
      'DECLARATORIO',
      'N DA DECLARACAO'
    ],
    none: [
      'RECIBO DE ENTREGA DA APURACAO NO PGDAS-D'
    ]
  },
  {
    documentType: 'DAS',
    confidence: 0.98,
    all: [
      'DOCUMENTO DE ARRECADACAO DO SIMPLES NACIONAL'
    ],
    any: [
      'PAGUE COM O PIX',
      'PAGAR ESTE DOCUMENTO ATE',
      'CODIGO PRINCIPAL',
      'AUTENTICACAO MECANICA'
    ]
  }
];

function detect(texto) {
  const normalized = normalizar(texto);

  for (const regra of regras) {
    const resultado = avaliarRegra(normalized, regra);

    if (resultado) {
      return resultado;
    }
  }

  return null;
}

module.exports = {
  family: FAMILY,
  detect
};
