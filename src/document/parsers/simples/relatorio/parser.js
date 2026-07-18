const parseIdentificacao = require('./parse.identificacao');
const parseResumo = require('./parse.resumo');
const parsePartilha = require('./parse.partilha');
const {
    parseApuracoes,
    consolidateByAnexo
} = require('./parse.apuracoes');

module.exports.name = 'relatorio-simples';

module.exports.parse = function parseRelatorioSimples(text) {
    const apuracoes = parseApuracoes(text);

    return {
        identificacao: parseIdentificacao(text),
        documento: {
            tipo: 'RELATORIO_SIMPLES'
        },
        resumo: parseResumo(text),
        apuracoes,
        consolidacaoPorAnexo: consolidateByAnexo(apuracoes),
        partilha: parsePartilha(text),
        extras: {
            origem: 'DOMINIO_SISTEMAS',
            sistemaLicenciado: /Sistema licenciado para/i.test(text),
            quantidadeApuracoes: apuracoes.length
        }
    };
};
