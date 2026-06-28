const parseIdentificacao = require('./parse.identificacao');
const parseResumo = require('./parse.resumo');
const parseReceitas = require('./parse.receitas');

module.exports.parse = (text) => {

    return {

        identificacao: parseIdentificacao(text),

        receitas: parseReceitas(text),

        resumo: parseResumo(text),

        extras: {}

    };

};