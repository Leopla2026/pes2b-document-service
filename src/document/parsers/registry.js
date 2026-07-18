const path = require('path');

const definitions = Object.freeze({
  DAS: Object.freeze({
    documentType: 'DAS',
    family: 'SIMPLES_NACIONAL',
    parserName: 'das',
    version: '1.0.0',
    schemaVersion: '1.0',
    status: 'active',
    description: 'Documento de Arrecadação do Simples Nacional.',
    minimumConfidence: 0.8,
    parser: require(
      path.join(__dirname, 'simples', 'das.parser.js')
    )
  }),

  RECIBO_PGDAS: Object.freeze({
    documentType: 'RECIBO_PGDAS',
    family: 'SIMPLES_NACIONAL',
    parserName: 'recibo-pgdas',
    version: '1.0.0',
    schemaVersion: '1.0',
    status: 'active',
    description: 'Recibo de entrega da apuração do PGDAS-D.',
    minimumConfidence: 0.8,
    parser: require(
      path.join(__dirname, 'simples', 'recibo.pgdas.parser.js')
    )
  }),

  DECLARACAO_PGDAS: Object.freeze({
    documentType: 'DECLARACAO_PGDAS',
    family: 'SIMPLES_NACIONAL',
    parserName: 'declaracao-pgdas',
    version: '1.0.0',
    schemaVersion: '1.0',
    status: 'active',
    description: 'Declaração de informações socioeconômicas e fiscais do PGDAS-D.',
    minimumConfidence: 0.8,
    parser: require(
      path.join(__dirname, 'simples', 'declaracao')
    )
  }),

  EXTRATO_PGDAS: Object.freeze({
    documentType: 'EXTRATO_PGDAS',
    family: 'SIMPLES_NACIONAL',
    parserName: 'extrato-pgdas',
    version: '1.0.0',
    schemaVersion: '1.0',
    status: 'active',
    description: 'Extrato da apuração do Simples Nacional.',
    minimumConfidence: 0.8,
    parser: require(
      path.join(__dirname, 'simples', 'extrato')
    )
  }),

  RELATORIO_SIMPLES: Object.freeze({
    documentType: 'RELATORIO_SIMPLES',
    family: 'SIMPLES_NACIONAL',
    parserName: 'relatorio-simples',
    version: '1.0.0',
    schemaVersion: '1.0',
    status: 'active',
    description: 'Relatório detalhado do cálculo do Simples Nacional.',
    minimumConfidence: 0.8,
    parser: require(
      path.join(__dirname, 'simples', 'relatorio')
    )
  }),

  DECLARACAO_FATURAMENTO: Object.freeze({
    documentType: 'DECLARACAO_FATURAMENTO',
    family: 'SIMPLES_NACIONAL',
    parserName: 'declaracao-faturamento',
    version: '1.0.0',
    schemaVersion: '1.0',
    status: 'active',
    description: 'Declaração de faturamento dos últimos doze meses.',
    minimumConfidence: 0.8,
    parser: require(
      path.join(__dirname, 'simples', 'declaracao-faturamento')
    )
  })
});

function getDefinition(documentType) {
  return definitions[documentType] || null;
}

function getParser(documentType) {
  const definition = getDefinition(documentType);

  if (!definition || definition.status !== 'active') {
    return null;
  }

  return definition.parser;
}

function has(documentType) {
  return Boolean(getDefinition(documentType));
}

function list(options = {}) {
  const includeParser = options.includeParser === true;

  return Object.values(definitions).map(definition => {
    if (includeParser) {
      return definition;
    }

    const { parser, ...metadata } = definition;
    return { ...metadata };
  });
}

function validate() {
  const errors = [];

  for (const definition of Object.values(definitions)) {
    if (!definition.documentType) {
      errors.push('Definição sem documentType.');
    }

    if (!definition.family) {
      errors.push(`${definition.documentType}: family não informada.`);
    }

    if (!definition.parserName) {
      errors.push(`${definition.documentType}: parserName não informado.`);
    }

    if (!definition.version) {
      errors.push(`${definition.documentType}: version não informada.`);
    }

    if (!definition.status) {
      errors.push(`${definition.documentType}: status não informado.`);
    }

    if (typeof definition.parser?.parse !== 'function') {
      errors.push(`${definition.documentType}: parser.parse não encontrado.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    count: Object.keys(definitions).length
  };
}

const registry = {
  definitions,
  getDefinition,
  getParser,
  has,
  list,
  validate
};

/*
 * Compatibilidade com o formato anterior:
 * registry.DAS continua devolvendo diretamente o parser.
 */
for (const documentType of Object.keys(definitions)) {
  Object.defineProperty(registry, documentType, {
    enumerable: true,
    configurable: false,
    get() {
      return getParser(documentType);
    }
  });
}

module.exports = Object.freeze(registry);
