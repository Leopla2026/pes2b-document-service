exports.parse = (text) => {

    const cnpj =
        text.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/)?.[0] || null;

    const empresaMatch = text.match(
        /CNPJ da Matriz\s*(.*?)\s*\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/i
    );

    const empresa = empresaMatch?.[1]?.replace(/\s+/g, ' ').trim() || null;

    const resumoMatch = text.match(
        /(\d{2}\/\d{4})\s+(\d{14,})\s+R\$\s*([\d\.,]+)\s+R\$\s*([\d\.,]+)\s+R\$\s*([\d\.,]+)\s+R\$\s*([\d\.,]+)/i
    );

    const competencia = resumoMatch?.[1] || null;
    const numeroDeclaracao = resumoMatch?.[2] || null;
    const receitaBruta = resumoMatch?.[3] || null;
    const totalDebitoDeclarado = resumoMatch?.[4] || null;
    const totalDebitoSuspenso = resumoMatch?.[5] || null;
    const totalDebitoExigivel = resumoMatch?.[6] || null;

    const transmissaoMatch = text.match(
        /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2}:\d{2})/
    );

    const dataTransmissao = transmissaoMatch?.[1] || null;
    const horaTransmissao = transmissaoMatch?.[2] || null;

    const numeroRecibo =
        text.match(/Número do Recibo\s*([\d\.\-]+)/i)?.[1] || null;

    const autenticacao =
        text.match(/Autenticação\s*([\d\.]+)/i)?.[1] || null;

    return {
        empresa,
        cnpj,
        competencia,
        numeroDeclaracao,
        numeroRecibo,
        dataTransmissao,
        horaTransmissao,
        receitaBruta,
        totalDebitoDeclarado,
        totalDebitoSuspenso,
        totalDebitoExigivel,
        autenticacao,
        tipoDeclaracao: "Original"
    };

};