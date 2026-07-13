function limparTexto(value) {
    return String(value || '')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizarMes(mesTexto) {
    const meses = {
        janeiro: '01',
        fevereiro: '02',
        marco: '03',
        março: '03',
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

    return meses[
        String(mesTexto || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
    ] || null;
}

module.exports = function parseIdentificacao(text) {
    const conteudo = limparTexto(text);

    const empresa =
        conteudo.match(
            /Declaramos\s+para\s+os\s+devidos\s+fins\s+que\s+(.+?),\s+estabelecid[ao]\s+em/i
        )?.[1]?.trim() ||
        null;

    const cnpj =
        conteudo.match(
            /Cadastro\s+Nacional\s+da\s+Pessoa\s+Jur[ií]dica\s+sob\s+n[.º°]*\s*(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/i
        )?.[1] ||
        conteudo.match(
            /\b(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})\b/
        )?.[1] ||
        null;

    const periodoMatch =
        conteudo.match(
            /per[ií]odo\s+de\s+([A-Za-zÀ-ÿ]+)\s+de\s+(\d{4})\s+a\s+([A-Za-zÀ-ÿ]+)\s+de\s+(\d{4})/i
        );

    const mesInicio =
        normalizarMes(periodoMatch?.[1]);

    const anoInicio =
        periodoMatch?.[2] || null;

    const mesFim =
        normalizarMes(periodoMatch?.[3]);

    const anoFim =
        periodoMatch?.[4] || null;

    const periodoInicio =
        mesInicio && anoInicio
            ? `${mesInicio}/${anoInicio}`
            : null;

    const periodoFim =
        mesFim && anoFim
            ? `${mesFim}/${anoFim}`
            : null;

    /*
     * Para o fluxo mensal, consideramos como competência
     * o último mês abrangido pela declaração.
     */
    const competencia = periodoFim;

    return {
        empresa,
        cnpj,
        competencia,
        periodoInicio,
        periodoFim
    };
};