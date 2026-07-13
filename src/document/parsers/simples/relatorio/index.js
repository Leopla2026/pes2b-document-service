const parseIdentificacao =
    require('./parse.identificacao');

const parseResumo =
    require('./parse.resumo');

const parsePartilha =
    require('./parse.partilha');

/*
 * Nome exibido no retorno da engine.
 */

module.exports.name = 'relatorio-simples';

module.exports.parse = function parseRelatorioSimples(text) {

    return {

        identificacao:
            parseIdentificacao(text),

        documento: {
            tipo: 'RELATORIO_SIMPLES'
        },

        resumo:
            parseResumo(text),

        partilha:
            parsePartilha(text),

        extras: {

            origem:
                'DOMINIO_SISTEMAS',

            sistemaLicenciado:
                /Sistema licenciado para/i.test(text)
        }
    };
};