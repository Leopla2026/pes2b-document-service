const {
    findCnpj
} = require('../../helpers/parser.helpers');

module.exports = function (text) {

    const empresa =
        text.match(/Nome Empresarial:\s*(.*?)\s*Data de Abertura/i)?.[1]?.trim()
        || null;

    const competencia =
        text.match(/Período de Apuração \(PA\):\s*(\d{2}\/\d{4})/i)?.[1]
        || null;

    return {
        empresa,
        cnpj: findCnpj(text),
        competencia
    };

};