exports.buildResponse = ({
  documentType,
  parser,
  pages,
  data,
  text,
  detection
}) => {
  const warnings = [];

  if (!data?.identificacao?.cnpj) {
    warnings.push('CNPJ não encontrado.');
  }

  if (!data?.identificacao?.competencia) {
    warnings.push('Competência não encontrada.');
  }

  const confidence = Number.isFinite(
    Number(detection?.confidence)
  )
    ? Number(detection.confidence)
    : warnings.length === 0
      ? 1
      : 0.9;

  return {
    success: true,

    engine: {
      version: '1.5.0',
      parser,
      confidence,
      family: detection?.family || 'UNKNOWN',
      detector: detection?.detector || 'none',
      matchedRules: detection?.matchedRules || []
    },

    documentType,
    pages,
    data,
    warnings,
    errors: [],
    text
  };
};
