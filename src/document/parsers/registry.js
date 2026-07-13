const path = require('path');

const extratoParser =
    require('./simples/extrato');

module.exports = {

    DAS:
        require(
            path.join(
                __dirname,
                'simples',
                'das.parser.js'
            )
        ),

    RECIBO_PGDAS:
        require(
            path.join(
                __dirname,
                'simples',
                'recibo.pgdas.parser.js'
            )
        ),

    DECLARACAO_PGDAS:
        require(
            path.join(
                __dirname,
                'simples',
                'declaracao'
            )
        ),

    EXTRATO_PGDAS:
        extratoParser,

    RELATORIO_SIMPLES:
        require(
            path.join(
                __dirname,
                'simples',
                'relatorio'
            )
        )
DECLARACAO_FATURAMENTO:
    require(
        path.join(
            __dirname,
            'simples',
            'declaracao-faturamento'
        )
    ),
};