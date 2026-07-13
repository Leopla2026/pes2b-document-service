function numeroMes(mes) {
    const mapa = {
        janeiro: '01',
        fevereiro: '02',
        marco: '03',
        abril: '04',
        maio: '05',
        junho: '06',
        julho: '07',
        agosto: '08',
        setembro: '09',
        outubro: '10',
        novembro: '11',
        dezembro: '12'
    };

    const normalizado = String(mes || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    return mapa[normalizado] || null;
}

module.exports = function parseEmissao(text) {
    const conteudo = String(text || '')
        .replace(/\s+/g, ' ')
        .trim();

    const match =
        conteudo.match(
            /([A-ZÀ-Ú\s]+),\s*(\d{1,2})\s+de\s+([A-Za-zÀ-ÿ]+)\s+de\s+(\d{4})/i
        );

    const cidade =
        match?.[1]?.trim() ||
        null;

    const dia =
        match?.[2]?.padStart(2, '0') ||
        null;

    const mes =
        numeroMes(match?.[3]);

    const ano =
        match?.[4] ||
        null;

    const data =
        dia && mes && ano
            ? `${dia}/${mes}/${ano}`
            : null;

    const dataISO =
        dia && mes && ano
            ? `${ano}-${mes}-${dia}`
            : null;

    return {
        cidade,
        data,
        dataISO
    };
};