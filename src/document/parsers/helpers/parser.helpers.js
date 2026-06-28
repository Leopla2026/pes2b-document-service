function findValue(text, regex) {
    return text.match(regex)?.[1]?.replace(/\s+/g, ' ').trim() || null;
}

function findCnpj(text) {
    return text.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/)?.[0] || null;
}

function findMoney(text, regex) {
    return text.match(regex)?.[1] || null;
}

function normalizeCompetencia(value) {
    if (!value) return null;

    const periodo = value.match(/(\d{2})\/(\d{2})\/(\d{4})\s*a\s*(\d{2})\/(\d{2})\/(\d{4})/i);

    if (periodo) {
        return `${periodo[2]}/${periodo[3]}`;
    }

    const competencia = value.match(/\b\d{2}\/\d{4}\b/);

    return competencia?.[0] || null;
}

module.exports = {
    findValue,
    findCnpj,
    findMoney,
    normalizeCompetencia
};