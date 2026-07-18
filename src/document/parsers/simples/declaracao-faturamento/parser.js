const parseIdentificacao =
    require('./parse.identificacao');

const parseFaturamento =
    require('./parse.faturamento');

const parseEmissao =
    require('./parse.emissao');

const parseResponsavel =
    require('./parse.responsavel');

module.exports.name =
    'declaracao-faturamento';

module.exports.parse = function parseDeclaracaoFaturamento(
    text
) {
    const identificacao =
        parseIdentificacao(text);

    const faturamento =
        parseFaturamento(text);

    const emissao =
        parseEmissao(text);

    const responsavel =
        parseResponsavel(text);

    const warnings = [];

    if (!identificacao.empresa) {
        warnings.push(
            'Nome empresarial não identificado.'
        );
    }

    if (!identificacao.cnpj) {
        warnings.push(
            'CNPJ não identificado.'
        );
    }

    if (!identificacao.competencia) {
        warnings.push(
            'Competência final não identificada.'
        );
    }

    if (faturamento.quantidadeMeses !== 12) {
        warnings.push(
            `A declaração possui ${faturamento.quantidadeMeses} mês(es), mas eram esperados 12.`
        );
    }

    if (!faturamento.totalConfere) {
        warnings.push(
            'A soma dos valores mensais não confere com o total informado.'
        );
    }

    return {
        identificacao: {
            empresa:
                identificacao.empresa,

            cnpj:
                identificacao.cnpj,

            competencia:
                identificacao.competencia
        },

        documento: {
            tipo:
                'DECLARACAO_FATURAMENTO',

            finalidade:
                'COMPROVACAO_FATURAMENTO_12_MESES'
        },

        periodo: {
            inicio:
                identificacao.periodoInicio,

            fim:
                identificacao.periodoFim
        },

        faturamento,

        emissao,

        responsavel,

        assinatura: {
            necessaria: true,
            assinada: false,
            tipoEsperado: 'PADES'
        },

        warnings
    };
};