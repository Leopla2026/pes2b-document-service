function findValue(text, regex) {
    const match = text.match(regex);
    if (!match) return null;

    return match[1]
        .replace(/\s+/g, ' ')
        .trim();
}

function findMoney(text, regex) {
    return findValue(text, regex);
}

function findCnpj(text) {
    return text.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/)?.[0] || null;
}

function findDate(text, regex = null) {
    if (regex) {
        return text.match(regex)?.[1] || null;
    }

    return text.match(/\d{2}\/\d{2}\/\d{4}/)?.[0] || null;
}

function findHour(text) {
    return text.match(/\d{2}:\d{2}:\d{2}/)?.[0] || null;
}

function findCPF(text) {
    return text.match(/\d{3}\.\d{3}\.\d{3}-\d{2}/)?.[0] || null;
}

function findIP(text) {
    return text.match(/\b\d{1,3}(?:\.\d{1,3}){3}\b/)?.[0] || null;
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

    const periodo = texto.match(/(\d{2})\/(\d{2})\/(\d{4})\s*a\s*(\d{2})\/(\d{2})\/(\d{4})/i);

    if (periodo) {
        return `${periodo[2]}/${periodo[3]}`;
    }

    return texto.match(/\d{2}\/\d{4}/)?.[0] || null;
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
    findDate,
    findHour,
    findCPF,
    findIP,
    normalizeCompetencia,
    onlyNumbers,
    normalizeMoney
};