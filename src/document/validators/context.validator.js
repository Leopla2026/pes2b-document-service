function normalizarCnpj(valor) {
  if (valor === null || valor === undefined) {
    return null;
  }

  const numeros = String(valor).replace(/\D/g, '');

  return numeros.length === 14
    ? numeros
    : null;
}

function normalizarCompetencia(valor) {
  if (valor === null || valor === undefined) {
    return null;
  }

  const texto = String(valor).trim();

  const matchIso = texto.match(
    /^(\d{4})-(\d{2})$/
  );

  if (matchIso) {
    return `${matchIso[1]}-${matchIso[2]}`;
  }

  const matchBr = texto.match(
    /^(\d{2})\/(\d{4})$/
  );

  if (matchBr) {
    return `${matchBr[2]}-${matchBr[1]}`;
  }

  return null;
}

function normalizarIbgeCode(valor) {
  if (valor === null || valor === undefined) {
    return null;
  }

  const numeros = String(valor)
    .replace(/\D/g, '');

  return numeros.length === 7
    ? numeros
    : null;
}

function normalizarUf(valor) {
  if (valor === null || valor === undefined) {
    return null;
  }

  const uf = String(valor)
    .trim()
    .toUpperCase();

  return /^[A-Z]{2}$/.test(uf)
    ? uf
    : null;
}

function validateExpectedContext({
  expected = {},
  actual = {}
} = {}) {
  const mismatches = [];

  if (
    expected.cnpj !== undefined &&
    expected.cnpj !== null &&
    String(expected.cnpj).trim() !== ''
  ) {
    const expectedCnpj = normalizarCnpj(
      expected.cnpj
    );

    const actualCnpj = normalizarCnpj(
      actual.cnpj
    );

    if (!actualCnpj) {
      mismatches.push({
        field: 'cnpj',
        expected: expectedCnpj,
        actual: null,
        code: 'CNPJ_NOT_FOUND'
      });
    } else if (expectedCnpj !== actualCnpj) {
      mismatches.push({
        field: 'cnpj',
        expected: expectedCnpj,
        actual: actualCnpj,
        code: 'CNPJ_MISMATCH'
      });
    }
  }

  if (
    expected.competence !== undefined &&
    expected.competence !== null &&
    String(expected.competence).trim() !== ''
  ) {
    const expectedCompetence =
      normalizarCompetencia(
        expected.competence
      );

    const actualCompetence =
      normalizarCompetencia(
        actual.competence
      );

    if (!actualCompetence) {
      mismatches.push({
        field: 'competence',
        expected: expectedCompetence,
        actual: null,
        code: 'COMPETENCE_NOT_FOUND'
      });
    } else if (
      expectedCompetence !==
      actualCompetence
    ) {
      mismatches.push({
        field: 'competence',
        expected: expectedCompetence,
        actual: actualCompetence,
        code: 'COMPETENCE_MISMATCH'
      });
    }
  }

  const expectedMunicipality =
    expected.municipality || {};

  const actualMunicipality =
    actual.municipality || {};

  if (
    expectedMunicipality.ibgeCode !== undefined &&
    expectedMunicipality.ibgeCode !== null &&
    String(expectedMunicipality.ibgeCode).trim() !== ''
  ) {
    const expectedIbge =
      normalizarIbgeCode(
        expectedMunicipality.ibgeCode
      );

    const actualIbge =
      normalizarIbgeCode(
        actualMunicipality.ibgeCode
      );

    if (!actualIbge) {
      mismatches.push({
        field: 'municipality.ibgeCode',
        expected: expectedIbge,
        actual: null,
        code: 'MUNICIPALITY_NOT_FOUND'
      });
    } else if (
      expectedIbge !== actualIbge
    ) {
      mismatches.push({
        field: 'municipality.ibgeCode',
        expected: expectedIbge,
        actual: actualIbge,
        code: 'MUNICIPALITY_MISMATCH'
      });
    }
  }

  if (
    expectedMunicipality.uf !== undefined &&
    expectedMunicipality.uf !== null &&
    String(expectedMunicipality.uf).trim() !== ''
  ) {
    const expectedUf =
      normalizarUf(
        expectedMunicipality.uf
      );

    const actualUf =
      normalizarUf(
        actualMunicipality.uf
      );

    if (!actualUf) {
      mismatches.push({
        field: 'municipality.uf',
        expected: expectedUf,
        actual: null,
        code: 'MUNICIPALITY_NOT_FOUND'
      });
    } else if (
      expectedUf !== actualUf
    ) {
      mismatches.push({
        field: 'municipality.uf',
        expected: expectedUf,
        actual: actualUf,
        code: 'MUNICIPALITY_MISMATCH'
      });
    }
  }

  return {
    valid: mismatches.length === 0,
    mismatches
  };
}

module.exports = {
  validateExpectedContext
};