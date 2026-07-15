const parseIdentificacao = require('./parse.identificacao');
const parseResumo = require('./parse.resumo');
const parseReceitas = require('./parse.receitas');
const parseRecepcao = require('./parse.recepcao');
const {
    extrairMetadadosDeclaracao
} = require('../helpers/declaracao.metadata');

module.exports.parse = (text) => {
    const identificacao = parseIdentificacao(text);
    const resumo = parseResumo(text);
    const recepcao = parseRecepcao(text);
    const metadados = extrairMetadadosDeclaracao(text);

    return {
        identificacao: {
            ...identificacao,
            numeroDeclaracao:
                identificacao.numeroDeclaracao ||
                metadados.numeroDeclaracao
        },
        documento: {
            tipo: 'DECLARACAO_PGDAS',
            tipoDeclaracao: metadados.tipoDeclaracao,
            ehRetificadora: metadados.ehRetificadora,
            tipoDeclaracaoIdentificado:
                metadados.tipoDeclaracaoIdentificado,
            numeroDeclaracao:
                identificacao.numeroDeclaracao ||
                metadados.numeroDeclaracao,
            numeroRecibo:
                recepcao.numeroRecibo ||
                metadados.numeroRecibo,
            autenticacao:
                recepcao.autenticacao ||
                metadados.autenticacao
        },
        receitas: parseReceitas(text),
        resumo,
        recepcao: {
            ...recepcao,
            dataTransmissaoISO:
                metadados.dataTransmissaoISO
        },
        extras: {
            retificacao: {
                tipoDeclaracao: metadados.tipoDeclaracao,
                ehRetificadora: metadados.ehRetificadora
            }
        }
    };
};
