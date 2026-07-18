const parseIdentificacao = require('./parse.identificacao');
const parseExtrato = require('./parse.extrato');

module.exports.parse = (text) => {

    return {

        identificacao: parseIdentificacao(text),

        extrato: parseExtrato(text),

        extras: {}

    };

};