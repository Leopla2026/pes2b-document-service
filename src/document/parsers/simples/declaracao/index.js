const parseIdentificacao = require('./parse.identificacao');
const parseResumo = require('./parse.resumo');

module.exports.parse = (text) => {

    return {

        identificacao: parseIdentificacao(text),

        resumo: parseResumo(text),

        extras: {}

    };

};