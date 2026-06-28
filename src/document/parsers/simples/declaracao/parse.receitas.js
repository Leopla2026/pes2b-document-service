function extrairValoresMonetarios(trecho) {
    return trecho.match(/\d{1,3}(?:\.\d{3})*,\d{2}/g) || [];
}

function extrairLinha(text, inicio, fim) {
    const regex = new RegExp(`${inicio}([\\s\\S]*?)${fim}`, 'i');
    return text.match(regex)?.[1] || '';
}

module.exports = (text) => {

    const rpaTrecho = extrairLinha(
        text,
        'Receita Bruta do PA \\(RPA\\) - Competência',
        'Receita bruta acumulada nos doze meses anteriores'
    );

    const rbt12Trecho = extrairLinha(
        text,
        'Receita bruta acumulada nos doze meses anteriores ao PA \\(RBT12\\)',
        'Receita bruta acumulada nos doze meses anteriores ao PA proporcionalizada'
    );

    const rbaTrecho = extrairLinha(
        text,
        'Receita bruta acumulada no ano-calendário corrente \\(RBA\\)',
        'Receita bruta acumulada no ano-calendário anterior'
    );

    const rbaaTrecho = extrairLinha(
        text,
        'Receita bruta acumulada no ano-calendário anterior \\(RBAA\\)',
        'Limite de receita bruta proporcionalizado'
    );

    const limiteTrecho = extrairLinha(
        text,
        'Limite de receita bruta proporcionalizado',
        '2.2\\)'
    );

    const rpa = extrairValoresMonetarios(rpaTrecho);
    const rbt12 = extrairValoresMonetarios(rbt12Trecho);
    const rba = extrairValoresMonetarios(rbaTrecho);
    const rbaa = extrairValoresMonetarios(rbaaTrecho);
    const limite = extrairValoresMonetarios(limiteTrecho);

    return {
        rpa: {
            mercadoInterno: rpa[0] || null,
            mercadoExterno: rpa[1] || null,
            total: rpa[2] || null
        },
        rbt12: {
            mercadoInterno: rbt12[0] || null,
            mercadoExterno: rbt12[1] || null,
            total: rbt12[2] || null
        },
        rba: {
            mercadoInterno: rba[0] || null,
            mercadoExterno: rba[1] || null,
            total: rba[2] || null
        },
        rbaa: {
            mercadoInterno: rbaa[0] || null,
            mercadoExterno: rbaa[1] || null,
            total: rbaa[2] || null
        },
        limiteReceitaBruta: {
            mercadoInterno: limite[0] || null,
            mercadoExterno: limite[1] || null
        }
    };

};