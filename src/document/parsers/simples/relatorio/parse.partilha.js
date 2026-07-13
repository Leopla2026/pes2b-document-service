const {
    normalizeMoney
} = require('../../helpers/parser.helpers');

module.exports = function parsePartilha(text) {

    /*
     * O pdf-parse normalmente retorna os valores da partilha
     * concatenados, por exemplo:
     *
     * 380,68493,1831,59145,6839,7745,45
     *
     * A expressão abaixo separa corretamente cada valor.
     */

    const trecho = text.match(
        /Partilha:.*?Valor:\s*([\d.,]+)\s*(?:[\d.]+,\d{2})?\s*Outros Acréscimos:/i
    )?.[1] || '';

    const valores =
        trecho.match(
            /\d{1,3}(?:\.\d{3})*,\d{2}/g
        ) || [];

    /*
     * A ordem corresponde ao relatório do Domínio:
     *
     * INSS/CPP
     * PIS
     * COFINS
     * CSLL
     * ISS
     * IRPJ
     */

    const nomes = [
        'inssCpp',
        'pis',
        'cofins',
        'csll',
        'iss',
        'irpj'
    ];

    const resultado = {};

    nomes.forEach((nome, index) => {

        const valor =
            valores[index] || null;

        resultado[nome] = valor;

        resultado[`${nome}Numero`] =
            normalizeMoney(valor);
    });

    return resultado;
};