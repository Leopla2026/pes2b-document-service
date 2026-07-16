const { normalizeMoney } = require('../../helpers/parser.helpers');

function clean(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

function inferTratamento(value) {
    const normalized = value.toUpperCase();

    if (normalized.includes('SUBSTITUIÇÃO TRIBUTÁRIA SOMENTE DO ICMS')) {
        return 'SUBSTITUICAO_TRIBUTARIA_ICMS';
    }
    if (normalized.includes('SEM SUBSTITUIÇÃO TRIBUTÁRIA')) {
        return 'SEM_SUBSTITUICAO_TRIBUTARIA';
    }
    if (normalized.includes('SEM RETENÇÃO') && normalized.includes('ISS')) {
        return 'SEM_RETENCAO_ISS';
    }
    if (normalized.includes('COM RETENÇÃO') && normalized.includes('ISS')) {
        return 'RETENCAO_ISS';
    }

    return 'OUTRO';
}

function parseApuracoes(text) {
    // pdf-parse compacta o cabeçalho como: "Anexo I - ComércioAnexo:"
    const marker = /(?:Anexo:\s*)?Anexo\s+([IVXLCDM]+)\s*-\s*([\s\S]*?)(?:Anexo:\s*|Seção:\s*)/gi;
    const matches = [...text.matchAll(marker)];
    const apuracoes = [];

    matches.forEach((match, index) => {
        const start = match.index;
        const end = index + 1 < matches.length
            ? matches[index + 1].index
            : text.length;
        const block = text.slice(start, end);

        const receitaTributada = block.match(
            /Receita Tributada Total:\s*([\d.]+,\d{2})/i
        )?.[1] || null;
        const aliquotaEfetiva = block.match(
            /Receita Tributada Total:\s*[\d.]+,\d{2}\s*Alíquota:\s*([\d.,]+)/i
        )?.[1] || null;
        const valorSimples = block.match(
            /([\d.]+,\d{2})\s*Simples Nacional Total:/i
        )?.[1] || block.match(
            /Simples Nacional Total:\s*([\d.]+,\d{2})/i
        )?.[1] || null;

        if (!receitaTributada || !valorSimples) {
            return;
        }

        const sectionAndTable = clean(
            block.slice(match[0].length)
        );
        const secao = clean(
            sectionAndTable.match(/^(.*?)(?:Tabela\s+\d+\s*-)/i)?.[1]
        ) || null;
        const tabela = clean(
            sectionAndTable.match(/(Tabela\s+\d+\s*-.*?)(?:Tabela:|\d[\d.]*,\d{2}\s*Simples Nacional Total:)/i)?.[1]
        ) || null;

        apuracoes.push({
            ordem: apuracoes.length + 1,
            anexo: match[1],
            descricaoAnexo: clean(match[2]) || null,
            secao,
            tabela,
            tratamentoTributario: inferTratamento(block),
            receitaTributada,
            receitaTributadaNumero: Number(normalizeMoney(receitaTributada)),
            aliquotaEfetiva,
            aliquotaEfetivaNumero: Number(normalizeMoney(aliquotaEfetiva)),
            valorSimples,
            valorSimplesNumero: Number(normalizeMoney(valorSimples))
        });
    });

    return apuracoes;
}

function consolidateByAnexo(apuracoes) {
    const grouped = new Map();

    for (const item of apuracoes) {
        const key = `${item.anexo}|${item.descricaoAnexo || ''}`;
        const current = grouped.get(key) || {
            anexo: item.anexo,
            descricaoAnexo: item.descricaoAnexo,
            receitaTributadaNumero: 0,
            valorSimplesNumero: 0,
            quantidadeApuracoes: 0
        };

        current.receitaTributadaNumero += item.receitaTributadaNumero || 0;
        current.valorSimplesNumero += item.valorSimplesNumero || 0;
        current.quantidadeApuracoes += 1;
        grouped.set(key, current);
    }

    return [...grouped.values()].map(item => ({
        ...item,
        receitaTributadaNumero: round(item.receitaTributadaNumero, 2),
        valorSimplesNumero: round(item.valorSimplesNumero, 2),
        aliquotaMediaNumero: item.receitaTributadaNumero > 0
            ? round((item.valorSimplesNumero / item.receitaTributadaNumero) * 100, 4)
            : 0
    }));
}

function round(value, decimals) {
    const factor = 10 ** decimals;
    return Math.round((value + Number.EPSILON) * factor) / factor;
}

module.exports = { parseApuracoes, consolidateByAnexo };
