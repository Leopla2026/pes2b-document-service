function findValue(text, regex) {

    const match = text.match(regex);

    if (!match) return null;

    return match[1]
        .replace(/\s+/g, ' ')
        .trim();

}

function findMoney(text, regex) {

    const value = findValue(text, regex);

    if (!value) return null;

    return value;

}

function findCnpj(text) {

    return text.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/)?.[0] || null;

}

function normalizeCompetencia(value) {

    if (!value) return null;

    const meses = {

        janeiro: "01",
        fevereiro: "02",
        março: "03",
        marco: "03",
        abril: "04",
        maio: "05",
        junho: "06",
        julho: "07",
        agosto: "08",
        setembro: "09",
        outubro: "10",
        novembro: "11",
        dezembro: "12"

    };

    const texto = value.toLowerCase();

    for (const mes in meses) {

        const regex = new RegExp(`${mes}\\/(\\d{4})`);

        const match = texto.match(regex);

        if (match) {

            return `${meses[mes]}/${match[1]}`;

        }

    }

    const competencia = texto.match(/\d{2}\/\d{4}/);

    return competencia?.[0] || null;

}

function onlyNumbers(value) {

    if (!value) return null;

    return value.replace(/\D/g, '');

}

function normalizeMoney(value) {

    if (!value) return null;

    return value
        .replace(/\./g, '')
        .replace(',', '.');

}

module.exports = {

    findValue,
    findMoney,
    findCnpj,
    normalizeCompetencia,
    onlyNumbers,
    normalizeMoney

};