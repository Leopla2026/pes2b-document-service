function normalizarNome(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function formatarCompetencia(competence) {
  if (!competence) {
    return null;
  }

  if (
    Number.isInteger(competence.month) &&
    Number.isInteger(competence.year)
  ) {
    return (
      `${String(competence.month).padStart(2, '0')}` +
      `-${competence.year}`
    );
  }

  if (
    typeof competence.reference === 'string'
  ) {
    const match = competence.reference.match(
      /^(\d{4})-(\d{2})$/
    );

    if (match) {
      return `${match[2]}-${match[1]}`;
    }
  }

  return null;
}

function buildDecPoaFileName({
  razaoSocial,
  cnpj,
  competence,
  suffix
}) {
  const nome = normalizarNome(razaoSocial);
  const cnpjNormalizado = String(cnpj || '')
    .replace(/\D/g, '');

  const competencia =
    formatarCompetencia(competence);

  if (
    !nome ||
    cnpjNormalizado.length !== 14 ||
    !competencia ||
    !suffix
  ) {
    return null;
  }

  return (
    `${nome}` +
    `__${cnpjNormalizado}` +
    `__${competencia}` +
    `_${suffix}.pdf`
  );
}

module.exports = {
  normalizarNome,
  formatarCompetencia,
  buildDecPoaFileName
};