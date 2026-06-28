module.exports = (text) => {

    const resumoMatch = text.match(
        /Resumo da Declaração.*?Receita Bruta Auferida.*?Valor Total do Débito Declarado.*?([\d\.]+,\d{2})([\d\.]+,\d{2})/i
    );

    return {
        receitaBruta: resumoMatch?.[1] || null,
        valorDebitoDeclarado: resumoMatch?.[2] || null
    };

};