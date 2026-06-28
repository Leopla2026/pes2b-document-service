module.exports = (text) => {

    const rpaMatch = text.match(
        /Receita Bruta do PA \(RPA\) - Competência\s*([\d\.,]+)\s*([\d\.,]+)\s*([\d\.,]+)/i
    );

    const rbt12Match = text.match(
        /Receita bruta acumulada nos doze meses anteriores ao PA \(RBT12\)\s*([\d\.,]+)\s*([\d\.,]+)\s*([\d\.,]+)/i
    );

    const rbaMatch = text.match(
        /Receita bruta acumulada no ano-calendário corrente \(RBA\)\s*([\d\.,]+)\s*([\d\.,]+)\s*([\d\.,]+)/i
    );

    const rbaaMatch = text.match(
        /Receita bruta acumulada no ano-calendário anterior \(RBAA\)\s*([\d\.,]+)\s*([\d\.,]+)\s*([\d\.,]+)/i
    );

    const limiteMatch = text.match(
        /Limite de receita bruta proporcionalizado\s*([\d\.,]+)\s*([\d\.,]+)/i
    );

    return {
        rpa: {
            mercadoInterno: rpaMatch?.[1] || null,
            mercadoExterno: rpaMatch?.[2] || null,
            total: rpaMatch?.[3] || null
        },
        rbt12: {
            mercadoInterno: rbt12Match?.[1] || null,
            mercadoExterno: rbt12Match?.[2] || null,
            total: rbt12Match?.[3] || null
        },
        rba: {
            mercadoInterno: rbaMatch?.[1] || null,
            mercadoExterno: rbaMatch?.[2] || null,
            total: rbaMatch?.[3] || null
        },
        rbaa: {
            mercadoInterno: rbaaMatch?.[1] || null,
            mercadoExterno: rbaaMatch?.[2] || null,
            total: rbaaMatch?.[3] || null
        },
        limiteReceitaBruta: {
            mercadoInterno: limiteMatch?.[1] || null,
            mercadoExterno: limiteMatch?.[2] || null
        }
    };

};