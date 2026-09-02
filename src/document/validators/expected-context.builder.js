function valorInformado(valor) {
  return (
    valor !== undefined &&
    valor !== null &&
    String(valor).trim() !== ''
  );
}

function buildExpectedContext(body = {}) {
  const expected = {};

  if (valorInformado(body.expectedCnpj)) {
    expected.cnpj = body.expectedCnpj;
  }

  if (valorInformado(body.expectedCompetence)) {
    expected.competence =
      body.expectedCompetence;
  }

  const municipality = {};

  if (
    valorInformado(
      body.expectedMunicipalityIbge
    )
  ) {
    municipality.ibgeCode =
      body.expectedMunicipalityIbge;
  }

  if (valorInformado(body.expectedUf)) {
    municipality.uf =
      body.expectedUf;
  }

  if (
    Object.keys(municipality).length > 0
  ) {
    expected.municipality =
      municipality;
  }

  if (Object.keys(expected).length === 0) {
    return null;
  }

  return expected;
}

module.exports = {
  buildExpectedContext
};