function buildActualContext({
  data = {}
} = {}) {
  return {
    cnpj:
      data?.company?.cnpj ??
      data?.identificacao?.cnpj ??
      null,

    competence:
      data?.competence?.reference ??
      data?.competence?.key ??
      data?.identificacao?.competencia ??
      null,

    municipality: {
      ibgeCode:
        data?.municipality?.ibgeCode ??
        data?.municipality?.ibge ??
        null,

      uf:
        data?.municipality?.uf ??
        null
    }
  };
}

module.exports = {
  buildActualContext
};