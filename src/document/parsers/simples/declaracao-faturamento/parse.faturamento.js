function normalizarValorBR(valor) {
    if (
        valor === undefined ||
        valor === null ||
        valor === ''
    ) {
        return null;
    }

    const numero = Number(
        String(valor)
            .replace(/\s/g, '')
            .replace(/\./g, '')
            .replace(',', '.')
            .replace(/[^\d.-]/g, '')
    );

    return Number.isFinite(numero)
        ? numero
        : null;
}

function normalizarNomeMes(mes) {
    return String(mes || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .trim();
}

function numeroMes(mes) {
    const mapa = {
        JANEIRO: '01',
        FEVEREIRO: '02',
        MARCO: '03',
        ABRIL: '04',
        MAIO: '05',
        JUNHO: '06',
        JULHO: '07',
        AGOSTO: '08',
        SETEMBRO: '09',
        OUTUBRO: '10',
        NOVEMBRO: '11',
        DEZEMBRO: '12'
    };

    return mapa[normalizarNomeMes(mes)] || null;
}

function arredondar(valor) {
    return Number(Number(valor || 0).toFixed(2));
}

module.exports = function parseFaturamento(text) {
    /*
     * O texto pode chegar assim:
     *
     * Julho/2025 R$ 6.715,00
     * Julho/2025 6.715,00 R$
     * Julho/20256.715,00R$
     *
     * Por isso aceitamos R$ antes, depois ou ausente.
     */
    const conteudo = String(text || '')
        .replace(/\u00A0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const meses = [];

    const regexMes =
        /(Janeiro|Fevereiro|Março|Marco|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro)\s*\/\s*(\d{4})\s*(?:R\$\s*)?([\d.]+,\d{2})\s*(?:R\$)?/gi;

    let match;

    while (
        (match = regexMes.exec(conteudo)) !== null
    ) {
        const mesNome = match[1];
        const mes = numeroMes(mesNome);
        const ano = match[2];
        const valorTexto = match[3];
        const valorNumero =
            normalizarValorBR(valorTexto);

        meses.push({
            mesNome,
            mes,
            ano,

            competencia:
                mes
                    ? `${mes}/${ano}`
                    : null,

            valor:
                valorTexto,

            valorNumero
        });
    }

    /*
     * Evita duplicidade caso o extrator repita algum trecho.
     * Mantemos somente uma ocorrência por competência.
     */
    const mesesPorCompetencia = new Map();

    for (const item of meses) {
        const chave =
            item.competencia ||
            `${item.mesNome}-${item.ano}`;

        if (!mesesPorCompetencia.has(chave)) {
            mesesPorCompetencia.set(
                chave,
                item
            );
        }
    }

    const mesesUnicos =
        Array.from(
            mesesPorCompetencia.values()
        );

    const totalMatch =
        conteudo.match(
            /TOTAL\s*(?:R\$\s*)?([\d.]+,\d{2})\s*(?:R\$)?/i
        );

    const total =
        totalMatch?.[1] ||
        null;

    const totalNumero =
        normalizarValorBR(total);

    const totalCalculado =
        arredondar(
            mesesUnicos.reduce(
                (soma, item) =>
                    soma +
                    (item.valorNumero || 0),
                0
            )
        );

    const diferenca =
        totalNumero !== null
            ? arredondar(
                Math.abs(
                    totalCalculado -
                    totalNumero
                )
            )
            : null;

    const totalConfere =
        diferenca !== null &&
        diferenca <= 0.01;

    const primeiraCompetencia =
        mesesUnicos[0]?.competencia ||
        null;

    const ultimaCompetencia =
        mesesUnicos[
            mesesUnicos.length - 1
        ]?.competencia ||
        null;

    return {
        total,
        totalNumero,
        totalCalculado,
        diferenca,
        totalConfere,

        quantidadeMeses:
            mesesUnicos.length,

        primeiraCompetencia,
        ultimaCompetencia,

        meses:
            mesesUnicos
    };
};