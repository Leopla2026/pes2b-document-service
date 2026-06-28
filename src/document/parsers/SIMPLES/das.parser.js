const extractCnpj = require('../../helpers/extractCnpj');
const extractCompetencia = require('../../helpers/extractCompetencia');
const extractValor = require('../../helpers/extractValor');

exports.parse = (text) => {
    const cnpj = extractCnpj(text);
    const competencia = extractCompetencia(text);

    const empresa =
        text.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\s*(.*?)\s*Período de Apuração/i)?.[1]?.trim()
        || text.match(/CNPJRazão Social\s*(.*?)\s*(Janeiro|Fevereiro|Mar[cç]o|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro)\/\d{4}/i)?.[1]?.trim()
        || null;

    const vencimento =
        text.match(/Pagar este documento até\s*(\d{2}\/\d{2}\/\d{4})/i)?.[1]
        || text.match(/Pagar até:\s*(\d{2}\/\d{2}\/\d{4})/i)?.[1]
        || null;

    const valorDocumento =
        extractValor(text, 'Valor Total do Documento')
        || extractValor(text, 'Valor:');

    const numeroDocumento =
        text.match(/Número do Documento\s*([\d\.\-]+)/i)?.[1]
        || text.match(/Número:([\d\.\-]+)/i)?.[1]
        || null;

    return {
        identificacao: {
            empresa,
            cnpj,
            competencia
        },
        documento: {
            tipo: 'DAS',
            numeroDocumento
        },
        datas: {
            vencimento
        },
        valores: {
            valorDocumento
        },
        extras: {}
    };
};