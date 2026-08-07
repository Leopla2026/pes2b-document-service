const {
    findValue,
    normalizeMoney
} = require('../../helpers/parser.helpers');

function money(text, regex) {
    return findValue(text, regex);
}

function asNumber(value) {
    const normalized = normalizeMoney(value);
    return normalized === null ? null : Number(normalized);
}

function parseMoneyNumber(value) {
    const normalized = normalizeMoney(value);
    if (normalized === null) return null;

    const number = Number(normalized);
    return Number.isFinite(number) ? number : null;
}

function normalizeRangeText(minimum, maximum) {
    if (!minimum || !maximum) return null;
    return `${minimum} a ${maximum}`;
}

function extractFaixasEnquadramento(text) {
    const labelRegex = /Faixa\s+de\s+Enquadramento\s*:/i;
    const labelMatch = labelRegex.exec(text);

    if (!labelMatch) {
        return [];
    }

    /*
     * Nos relatórios da Domínio, a linha de faixa pode trazer dois
     * intervalos: Mercado Interno e Mercado Externo. A ordem do texto
     * extraído do PDF pode variar conforme o layout do documento.
     *
     * Limitamos a leitura à região logo após o rótulo para não capturar
     * outros intervalos monetários existentes no restante do relatório.
     */
    const start = labelMatch.index + labelMatch[0].length;
    const trecho = text.slice(start, start + 280);

    const rangeRegex = /(\d{1,3}(?:\.\d{3})*,\d{2})\s*a\s*(\d{1,3}(?:\.\d{3})*,\d{2})/gi;
    const ranges = [];
    let match;

    while ((match = rangeRegex.exec(trecho)) !== null) {
        const minimum = match[1];
        const maximum = match[2];
        const minimumNumber = parseMoneyNumber(minimum);
        const maximumNumber = parseMoneyNumber(maximum);

        if (minimumNumber === null || maximumNumber === null) {
            continue;
        }

        ranges.push({
            text: normalizeRangeText(minimum, maximum),
            minimum: minimumNumber,
            maximum: maximumNumber
        });

        if (ranges.length >= 2) {
            break;
        }
    }

    return ranges;
}

function resolveFaixasEnquadramento(text, rbt12) {
    const ranges = extractFaixasEnquadramento(text);

    if (ranges.length === 0) {
        return {
            mercadoInterno: null,
            mercadoExterno: null
        };
    }

    if (ranges.length === 1) {
        return {
            mercadoInterno: ranges[0].text,
            mercadoExterno: null
        };
    }

    const rbt12Number = parseMoneyNumber(rbt12);

    if (rbt12Number !== null) {
        const internalIndex = ranges.findIndex(range =>
            rbt12Number >= range.minimum &&
            rbt12Number <= range.maximum
        );

        if (internalIndex !== -1) {
            return {
                mercadoInterno: ranges[internalIndex].text,
                mercadoExterno: ranges[internalIndex === 0 ? 1 : 0].text
            };
        }
    }

    /*
     * Fallback compatível com o layout tradicional da Domínio:
     * primeira faixa = mercado interno; segunda = mercado externo.
     */
    return {
        mercadoInterno: ranges[0].text,
        mercadoExterno: ranges[1].text
    };
}

module.exports = function parseResumo(text) {
    const receitaBrutaMes = money(
        text,
        /Receita Bruta do período de Apuração \(RPA\)\s*-\s*(?:Regime de Competência\s*)?([\d.]+,\d{2})/i
    );

    const rbt12 = money(
        text,
        /Receita bruta acumulada nos doze meses anteriores(?:\s*ao período de apuração)?\s*([\d.]+,\d{2})/i
    );

    const rbaAtual = money(
        text,
        /Receita bruta acumulada no ano-calendário\s*([\d.]+,\d{2})\s*corrente \(RBA\)/i
    ) || money(
        text,
        /Receita bruta acumulada no ano-calendário\s*corrente \(RBA\)\s*([\d.]+,\d{2})/i
    );

    const rbaAnterior = money(
        text,
        /Receita bruta acumulada no ano-calendário\s*([\d.]+,\d{2})\s*anterior \(RBA\)/i
    ) || money(
        text,
        /Receita bruta acumulada no ano-calendário\s*anterior \(RBA\)\s*([\d.]+,\d{2})/i
    );

    const faixasEnquadramento = resolveFaixasEnquadramento(text, rbt12);

    /*
     * Mantemos faixaEnquadramento como string por compatibilidade com o
     * n8n e com o template atual do e-mail. O valor legado passa a ser
     * sempre o Mercado Interno.
     */
    const faixaEnquadramento = faixasEnquadramento.mercadoInterno;

    const valorSimplesRecolher = money(
        text,
        /Simples Nacional a recolher:\s*([\d.]+,\d{2})/i
    ) || money(
        text,
        /([\d.]+,\d{2})\s*Simples Nacional a recolher:/i
    );

    const receitaNumero = asNumber(receitaBrutaMes);
    const impostoNumero = asNumber(valorSimplesRecolher);
    const cargaTributariaTotalNumero = receitaNumero > 0 && impostoNumero !== null
        ? Math.round(((impostoNumero / receitaNumero) * 100 + Number.EPSILON) * 10000) / 10000
        : null;

    return {
        receitaBrutaMes,
        receitaBrutaMesNumero: normalizeMoney(receitaBrutaMes),
        rbt12,
        rbt12Numero: normalizeMoney(rbt12),
        rbaAtual,
        rbaAtualNumero: normalizeMoney(rbaAtual),
        rbaAnterior,
        rbaAnteriorNumero: normalizeMoney(rbaAnterior),
        faixaEnquadramento,
        faixaEnquadramentoMercadoInterno: faixasEnquadramento.mercadoInterno,
        faixaEnquadramentoMercadoExterno: faixasEnquadramento.mercadoExterno,
        valorSimplesRecolher,
        valorSimplesRecolherNumero: normalizeMoney(valorSimplesRecolher),
        cargaTributariaTotalNumero
    };
};
