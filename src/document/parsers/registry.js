const path = require('path');

function loadParser(folderName, parserName) {
  const parserModule = require(
    path.join(__dirname, 'simples', folderName)
  );

  const rules = parserModule.rules || {};
  const schema = parserModule.schema || {};

  return Object.freeze({
    documentType: rules.documentType,
    family: rules.family,
    parserName,
    version: rules.parserVersion || '1.0.0',
    schemaVersion: schema.version || '1.0',
    status: 'active',
    description: rules.description || '',
    minimumConfidence:
      Number.isFinite(rules.minimumConfidence)
        ? rules.minimumConfidence
        : 0.8,
    schema,
    rules,
    parser: parserModule
  });
}

const definitions = Object.freeze({
  DAS: loadParser('das', 'das'),
  RECIBO_PGDAS: loadParser('recibo', 'recibo-pgdas'),
  DECLARACAO_PGDAS: loadParser('declaracao', 'declaracao-pgdas'),
  EXTRATO_PGDAS: loadParser('extrato', 'extrato-pgdas'),
  RELATORIO_SIMPLES: loadParser('relatorio', 'relatorio-simples'),
  DECLARACAO_FATURAMENTO: loadParser(
    'declaracao-faturamento',
    'declaracao-faturamento'
  )
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
  const includeSchema = options.includeSchema === true;
  const includeRules = options.includeRules === true;

  return Object.values(definitions).map(definition => {
    const {
      parser,
      schema,
      rules,
      ...metadata
    } = definition;

    if (includeParser) metadata.parser = parser;
    if (includeSchema) metadata.schema = schema;
    if (includeRules) metadata.rules = rules;

    return metadata;
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

    if (!definition.schemaVersion) {
      errors.push(`${definition.documentType}: schemaVersion não informada.`);
    }

    if (!definition.status) {
      errors.push(`${definition.documentType}: status não informado.`);
    }

    if (typeof definition.parser?.parse !== 'function') {
      errors.push(`${definition.documentType}: parser.parse não encontrado.`);
    }

    if (!Array.isArray(definition.schema?.required)) {
      errors.push(`${definition.documentType}: schema.required não encontrado.`);
    }

    if (
      definition.rules?.documentType !==
      definition.documentType
    ) {
      errors.push(`${definition.documentType}: rules.documentType divergente.`);
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
