exports.parse = (text) => {

    const empresa =
        text.match(/([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ ]+SOCIEDADE INDIVIDUAL DE ADVOCACIA)/i)?.[1]?.trim()
        || null;

    const cnpj =
        text.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/)?.[0]
        || null;

    const competencia =
        text.match(/Período de Apuração\s*(\d{2}\/\d{4})/i)?.[1]
        || null;

    const vencimento =
        text.match(/Pagar este documento até\s*(\d{2}\/\d{2}\/\d{4})/i)?.[1]
        || null;

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