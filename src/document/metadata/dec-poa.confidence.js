function temValor(valor) {
  return (
    valor !== undefined &&
    valor !== null &&
    valor !== ''
  );
}

function todosPresentes(valores) {
  return valores.every(temValor);
}

function buildDecPoaConfidence(data = {}) {
  const company = data.company || {};
  const competence = data.competence || {};
  const financial = data.financial || {};
  const receipt = data.receipt || {};
  const guide = data.guide || {};

  const companyConfidence =
    todosPresentes([
      company.cnpj,
      company.razaoSocial,
      company.inscricaoMunicipal
    ])
      ? 1
      : null;

  const competenceConfidence =
    todosPresentes([
      competence.year,
      competence.month,
      competence.reference,
      competence.display
    ])
      ? 1
      : null;

  const financialConfidence =
    [
      financial.servicesRevenue,
      financial.deductions,
      financial.taxBase,
      financial.issOwn,
      financial.issWithheldSubstitution,
      financial.issWithheldFromThirdParties,
      financial.issSolidaryResponsibility,
      financial.issCpom,
      financial.totalTaxDue,
      financial.totalToCollect
    ].every(valor => typeof valor === 'number')
      ? 1
      : null;

  const receiptConfidence =
    todosPresentes([
      receipt.status,
      receipt.submittedAt,
      receipt.authentication
    ])
      ? 1
      : null;

  let guideConfidence = null;

  if (guide.present === false) {
    guideConfidence = 1;
  } else if (
    guide.present === true &&
    todosPresentes([
      guide.collectionCode,
      guide.dueDate,
      guide.generatedAt,
      guide.barcode,
      guide.taxAmount,
      guide.amountToPay
    ])
  ) {
    guideConfidence = 1;
  }

  return {
    company: companyConfidence,
    competence: competenceConfidence,
    financial: financialConfidence,
    receipt: receiptConfidence,
    guide: guideConfidence
  };
}

module.exports = {
  buildDecPoaConfidence
};