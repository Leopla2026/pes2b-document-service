function mesTextoParaNumero(mes) {
    const mapa = {
        janeiro: '01',
        fevereiro: '02',
        marco: '03',
        março: '03',
        abril: '04',
        maio: '05',
        junho: '06',
        julho: '07',
        agosto: '08',
        setembro: '09',
        outubro: '10',
        novembro: '11',
        dezembro: '12'
    };

    return mapa[mes.toLowerCase()] || null;
}

exports.parse = (text) => {

    const empresa =
        text.match(/([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ ]+SOCIEDADE INDIVIDUAL DE ADVOCACIA)/i)?.[1]?.trim()
        || null;

    const cnpj =
        text.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/)?.[0]
        || null;

    const competenciaPorExtenso = text.match(
        /(Janeiro|Fevereiro|Mar[cç]o|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro)\/(\d{4})/i
    );

    const competencia = competenciaPorExtenso
        ? `${mesTextoParaNumero(competenciaPorExtenso[1])}/${competenciaPorExtenso[2]}`
        : null;

    const vencimento =
        text.match(/Pagar este documento até\s*(\d{2}\/\d{2}\/\d{4})/i)?.[1]
        || text.match(/Pagar até:\s*(\d{2}\/\d{2}\/\d{4})/i)?.[1]
        || null;

    const valor =
        text.match(/Valor Total do Documento\s*([\d\.,]+)/i)?.[1]
        || text.match(/Valor:\s*([\d\.,]+)/i)?.[1]
        || null;

    return {
        empresa,
        cnpj,
        competencia,
        vencimento,
        valorDocumento: valor
    };

};