const {
    findMoney
} = require('../../helpers/parser.helpers');

module.exports = (text) => {

    return {

        receitaPeriodo: findMoney(
            text,
            /Receita Bruta Acumulada\s*RPA\s*([\d\.,]+)/i
        ),

        rbt12: findMoney(
            text,
            /Receita Bruta Total nos 12 meses anteriores\s*RBT12\s*([\d\.,]+)/i
        ),

        rbt12Proporcional: findMoney(
            text,
            /RBT12 Proporcionalizada\s*([\d\.,]+)/i
        ),

        mercadoInterno: findMoney(
            text,
            /Mercado Interno\s*([\d\.,]+)/i
        ),

        mercadoExterno: findMoney(
            text,
            /Mercado Externo\s*([\d\.,]+)/i
        ),

        limiteSimples: findMoney(
            text,
            /Limite da Receita Bruta\s*([\d\.,]+)/i
        )

    };

};