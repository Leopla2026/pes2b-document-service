const extractCnpj = require('../../../helpers/extractCnpj');
const {
    extrairMetadadosDeclaracao
} = require('../helpers/declaracao.metadata');

function valorNumero(valor) {
    if (!valor) return null;

    const numero = Number(
        String(valor)
            .replace(/\./g, '')
            .replace(',', '.')
    );

    return Number.isFinite(numero) ? numero : null;
}

exports.parse = (text) => {
    const cnpj = extractCnpj(text);
    const metadados = extrairMetadadosDeclaracao(text);

    const empresa =
        text.match(/CNPJ da Matriz\s*(.*?)\s*\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/i)?.[1]
            ?.replace(/\s+/g, ' ')
            .trim() ||
        null;

    const resumoMatch = text.match(
        /(\d{2}\/\d{4})\s*(\d{14,})\s*R\$\s*([\d.,]+)\s*R\$\s*([\d.,]+)\s*R\$\s*([\d.,]+)\s*R\$\s*([\d.,]+)/i
    );

    const competencia = resumoMatch?.[1] || null;
    const numeroDeclaracao =
        resumoMatch?.[2] ||
        metadados.numeroDeclaracao;
    const receitaBruta = resumoMatch?.[3] || null;
    const totalDebitoDeclarado = resumoMatch?.[4] || null;
    const totalDebitoSuspenso = resumoMatch?.[5] || null;
    const totalDebitoExigivel = resumoMatch?.[6] || null;

    return {
        identificacao: {
            empresa,
            cnpj,
            competencia
        },
        documento: {
            tipo: 'RECIBO_PGDAS',
            numeroDeclaracao,
            numeroRecibo: metadados.numeroRecibo,
            autenticacao: metadados.autenticacao,
            tipoDeclaracao: metadados.tipoDeclaracao,
            ehRetificadora: metadados.ehRetificadora,
            tipoDeclaracaoIdentificado:
                metadados.tipoDeclaracaoIdentificado
        },
        datas: {
            dataTransmissao: metadados.dataTransmissao,
            horaTransmissao: metadados.horaTransmissao,
            dataTransmissaoISO:
                metadados.dataTransmissaoISO
        },
        valores: {
            receitaBruta,
            receitaBrutaNumero: valorNumero(receitaBruta),
            totalDebitoDeclarado,
            totalDebitoDeclaradoNumero:
                valorNumero(totalDebitoDeclarado),
            totalDebitoSuspenso,
            totalDebitoSuspensoNumero:
                valorNumero(totalDebitoSuspenso),
            totalDebitoExigivel,
            totalDebitoExigivelNumero:
                valorNumero(totalDebitoExigivel)
        },
        extras: {
            retificacao: {
                tipoDeclaracao: metadados.tipoDeclaracao,
                ehRetificadora: metadados.ehRetificadora
            }
        }
    };
};
