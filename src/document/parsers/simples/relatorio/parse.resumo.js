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

    const faixaEnquadramento = findValue(
        text,
        /Faixa de Enquadramento:\s*(\d{1,3}(?:\.\d{3})*,\d{2}\s*a\s*\d{1,3}(?:\.\d{3})*,\d{2})/i
    );

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
        valorSimplesRecolher,
        valorSimplesRecolherNumero: normalizeMoney(valorSimplesRecolher),
        cargaTributariaTotalNumero
    };
};
