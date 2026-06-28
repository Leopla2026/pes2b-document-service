exports.parse = (text) => {

    const empresa =
        text.match(/([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ ]+SOCIEDADE INDIVIDUAL DE ADVOCACIA)/i)?.[1]?.trim()
        || null;

    const cnpj =
        text.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/)?.[0]
        || null;

    const competencias = text.match(/\b\d{2}\/\d{4}\b/g);
    const datas = text.match(/\b\d{2}\/\d{2}\/\d{4}\b/g);

    const competencia = competencias?.[0] || null;
    const vencimento = datas?.[0] || null;

    const valor =
        text.match(/Valor Total do Documento\s*([\d\.,]+)/i)?.[1]
        || null;

    return {
        empresa,
        cnpj,
        competencia,
        vencimento,
        valorDocumento: valor
    };

};