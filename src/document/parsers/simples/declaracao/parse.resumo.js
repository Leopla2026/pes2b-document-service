const {
    findMoney
} = require('../../helpers/parser.helpers');

module.exports = (text) => {

    return {

        receitaBruta: findMoney(
            text,
            /Receita Bruta Auferida.*?([\d\.,]+)/is
        ),

        valorDebitoDeclarado: findMoney(
            text,
            /Valor Total do Débito Declarado.*?([\d\.,]+)/is
        )

    };

};