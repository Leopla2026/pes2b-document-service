const parseIdentificacao = require('./parse.identificacao');
const parseResumo = require('./parse.resumo');
const parseReceitas = require('./parse.receitas');
const parseRecepcao = require('./parse.recepcao');

module.exports.parse = (text) => {

    return {
        identificacao: parseIdentificacao(text),
        receitas: parseReceitas(text),
        resumo: parseResumo(text),
        recepcao: parseRecepcao(text),
        extras: {}
    };

};