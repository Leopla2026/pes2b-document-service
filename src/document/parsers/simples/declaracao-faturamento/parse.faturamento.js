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
    );

    return Number.isFinite(numero)
        ? numero
        : null;
}

function normalizarNomeMes(mes) {
    return String(mes || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase();
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

module.exports = function parseFaturamento(text) {
    const conteudo = String(text || '')
        .replace(/\s+/g, ' ')
        .trim();

    const meses = [];

    const regexMes =
        /(Janeiro|Fevereiro|Março|Marco|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro)\s*\/\s*(\d{4})\s*R\$\s*([\d.]+,\d{2})/gi;

    let match;

    while ((match = regexMes.exec(conteudo)) !== null) {
        const mesNumero = numeroMes(match[1]);
        const ano = match[2];
        const valorTexto = match[3];

        meses.push({
            mesNome: match[1],
            mes: mesNumero,
            ano,
            competencia:
                mesNumero
                    ? `${mesNumero}/${ano}`
                    : null,
            valor: valorTexto,
            valorNumero:
                normalizarValorBR(valorTexto)
        });
    }

    const total =
        conteudo.match(
            /TOTAL\s+(?:R\$\s*)?([\d.]+,\d{2})/i
        )?.[1] ||
        null;

    const totalCalculado =
        meses.reduce(
            (soma, item) =>
                soma + (item.valorNumero || 0),
            0
        );

    const totalNumero =
        normalizarValorBR(total);

    const diferenca =
        totalNumero !== null
            ? Number(
                Math.abs(
                    totalCalculado - totalNumero
                ).toFixed(2)
            )
            : null;

    return {
        total,
        totalNumero,
        totalCalculado:
            Number(totalCalculado.toFixed(2)),
        diferenca,
        totalConfere:
            diferenca !== null
                ? diferenca <= 0.01
                : false,
        quantidadeMeses:
            meses.length,
        meses
    };
};