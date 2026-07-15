const {
    extrairMetadadosDeclaracao
} = require('../helpers/declaracao.metadata');

module.exports = function (text) {
    const metadados = extrairMetadadosDeclaracao(text);

    return {
        dataTransmissao: metadados.dataTransmissao,
        horaTransmissao: metadados.horaTransmissao,
        dataTransmissaoISO: metadados.dataTransmissaoISO,
        numeroRecibo: metadados.numeroRecibo,
        autenticacao: metadados.autenticacao
    };
};
