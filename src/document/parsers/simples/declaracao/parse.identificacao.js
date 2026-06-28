const {
    findValue,
    findCnpj,
    normalizeCompetencia
} = require('../../helpers/parser.helpers');

module.exports = (text) => {

    const empresa = findValue(
        text,
        /Nome empresarial:\s*(.+?)\s*Data de abertura/i
    );

    const cnpj = findCnpj(text);

    const periodo = findValue(
        text,
        /Período de Apuração:\s*(.+?)\s*Número da Declaração/i
    );

    const numeroDeclaracao = findValue(
        text,
        /N[ºo]\s*da Declaração:\s*([0-9]+)/i
    );

    return {

        empresa,

        cnpj,

        competencia: normalizeCompetencia(periodo),

        numeroDeclaracao

    };

};