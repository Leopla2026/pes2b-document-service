const path = require('path');

module.exports = {
    DAS: require(path.join(__dirname, 'simples', 'das.parser.js')),
    RECIBO_PGDAS: require(path.join(__dirname, 'simples', 'recibo.pgdas.parser.js')),
    DECLARACAO_PGDAS: require(path.join(__dirname, 'simples', 'declaracao')),
    EXTRATO_PGDAS: require(path.join(__dirname, 'simples', 'extrato.pgdas.parser.js'))
};