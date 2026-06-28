const extractCnpj = require('../../helpers/extractCnpj');

exports.parse = (text) => {
    const cnpj = extractCnpj(text);

    const empresa =
        text.match(/CNPJ da Matriz\s*(.*?)\s*\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/i)?.[1]?.replace(/\s+/g, ' ').trim()
        || null;

    const resumoMatch = text.match(
        /(\d{2}\/\d{4})(\d{14,})R\$\s*([\d\.,]+)R\$\s*([\d\.,]+)R\$\s*([\d\.,]+)R\$\s*([\d\.,]+)/i
    );

    const competencia = resumoMatch?.[1] || null;
    const numeroDeclaracao = resumoMatch?.[2] || null;
    const receitaBruta = resumoMatch?.[3] || null;
    const totalDebitoDeclarado = resumoMatch?.[4] || null;
    const totalDebitoSuspenso = resumoMatch?.[5] || null;
    const totalDebitoExigivel = resumoMatch?.[6] || null;

    const transmissaoMatch = text.match(/(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2}:\d{2})/);

    const numeroRecibo =
        text.match(/Número do Recibo\s*([\d\.\-]+)/i)?.[1] || null;

    const autenticacao =
        text.match(/Autenticação\s*([\d\.]+)/i)?.[1] || null;

    return {
        identificacao: {
            empresa,
            cnpj,
            competencia
        },
        documento: {
            tipo: 'RECIBO_PGDAS',
            numeroDeclaracao,
            numeroRecibo,
            autenticacao,
            tipoDeclaracao: 'Original'
        },
        datas: {
            dataTransmissao: transmissaoMatch?.[1] || null,
            horaTransmissao: transmissaoMatch?.[2] || null
        },
        valores: {
            receitaBruta,
            totalDebitoDeclarado,
            totalDebitoSuspenso,
            totalDebitoExigivel
        },
        extras: {}
    };
};