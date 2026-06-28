const {
    findCnpj,
    normalizeCompetencia
} = require('../../helpers/parser.helpers');

module.exports = function (text) {

    const empresa =
        text.match(/Nome Empresarial:\s*([^\n]+?)\s*Data de Abertura/i)?.[1]?.trim() ??
        null;

    const competencia =
        normalizeCompetencia(
            text.match(/Período de Apuração \(PA\):\s*([0-9\/]+\s*a\s*[0-9\/]+)/i)?.[1]
        );

    return {

        empresa,

        cnpj: findCnpj(text),

        competencia

    };

};