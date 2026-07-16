const {
    findCnpj,
    findDate
} = require('../../helpers/parser.helpers');

function extractCompetenciaRelatorio(text) {
    const direct = text.match(
        /Per[ií]odo\s*:\s*(\d{2}\/\d{4})/i
    )?.[1];

    if (direct) {
        return direct;
    }

    const nearPeriod = text.match(
        /Per[ií]odo\s*:[\s\S]{0,120}?\b(0[1-9]|1[0-2])\/(\d{4})\b/i
    );

    if (nearPeriod) {
        return `${nearPeriod[1]}/${nearPeriod[2]}`;
    }

    const headerEnd = text.search(/SIMPLES\s+NACIONAL/i);
    const header = headerEnd >= 0
        ? text.slice(0, headerEnd + 30)
        : text.slice(0, 600);

    return header.match(
        /\b(0[1-9]|1[0-2])\/(\d{4})\b/
    )?.[0] || null;
}

module.exports = function parseIdentificacao(text) {
    const empresa =
        text.match(
            /Página:\s*\d+\s+\d{2}\/\d{2}\/\d{4}\s+(.+?)\s+CNPJ:/i
        )?.[1]?.replace(/\s+/g, ' ').trim()

        || text.match(
            /Empresa:\s*(.+?)\s+CNPJ:/i
        )?.[1]?.replace(/\s+/g, ' ').trim()

        || null;

    const dataEmissao =
        text.match(
            /Página:\s*\d+\s+(\d{2}\/\d{2}\/\d{4})/i
        )?.[1]

        || findDate(text)

        || null;

    const codigoEmpresa =
        empresa?.match(/^([\d.]+)\s+/)?.[1]

        || text.match(
            /Estabelecimento:\s*(\d+)/i
        )?.[1]

        || null;

    return {
        empresa,
        cnpj: findCnpj(text),
        competencia: extractCompetenciaRelatorio(text),
        codigoEmpresa,
        dataEmissao
    };
};

module.exports.extractCompetenciaRelatorio = extractCompetenciaRelatorio;
