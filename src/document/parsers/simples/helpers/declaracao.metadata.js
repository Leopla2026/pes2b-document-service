function normalizarTexto(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase();
}

function detectarTipoDeclaracao(text) {
    const normalized = normalizarTexto(text);

    if (normalized.includes('DECLARACAO RETIFICADORA')) {
        return 'RETIFICADORA';
    }

    if (normalized.includes('DECLARACAO ORIGINAL')) {
        return 'ORIGINAL';
    }

    return 'NAO_IDENTIFICADO';
}

function extrairNumeroDeclaracao(text) {
    return (
        text.match(/N[ºo°]?\s*(?:da\s+)?Declara(?:ç|c)[aã]o\s*:?\s*([0-9]{14,})/i)?.[1] ||
        text.match(/N[uú]mero\s+da\s+(?:Declara(?:ç|c)[aã]o|Apura(?:ç|c)[aã]o)\s*:?\s*([0-9]{14,})/i)?.[1] ||
        null
    );
}

function extrairNumeroRecibo(text) {
    return (
        text.match(/N[uú]mero\s+do\s+Recibo\s*:?\s*([0-9.\-]+)/i)?.[1] ||
        text.match(/\b01\.\d{2}\.\d{5}\.\d{7}-\d\b/)?.[0] ||
        null
    );
}

function extrairAutenticacao(text) {
    return (
        text.match(/Autentica(?:ç|c)[aã]o\s*:?\s*([0-9.]+)/i)?.[1] ||
        text.match(/\b\d{5}\.\d{5}\.\d{5}\.\d{5}\b/)?.[0] ||
        null
    );
}

function extrairTransmissao(text) {
    const match = text.match(
        /Data\s+e\s+(?:hor[aá]rio|Hor[aá]rio)\s+da\s+transmiss[aã]o(?:\s+da\s+(?:Declara(?:ç|c)[aã]o|Apura(?:ç|c)[aã]o)(?:\s+no\s+PGDAS-D)?)?\s*(?:\([^)]*\))?\s*:?\s*(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2}:\d{2})/i
    ) || text.match(/(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2}:\d{2})/);

    const dataTransmissao = match?.[1] || null;
    const horaTransmissao = match?.[2] || null;

    let dataTransmissaoISO = null;

    if (dataTransmissao && horaTransmissao) {
        const [dia, mes, ano] = dataTransmissao.split('/');
        dataTransmissaoISO = `${ano}-${mes}-${dia}T${horaTransmissao}-03:00`;
    }

    return {
        dataTransmissao,
        horaTransmissao,
        dataTransmissaoISO
    };
}

function extrairMetadadosDeclaracao(text) {
    const tipoDeclaracao = detectarTipoDeclaracao(text);
    const transmissao = extrairTransmissao(text);

    return {
        tipoDeclaracao,
        ehRetificadora: tipoDeclaracao === 'RETIFICADORA',
        tipoDeclaracaoIdentificado:
            tipoDeclaracao !== 'NAO_IDENTIFICADO',
        numeroDeclaracao: extrairNumeroDeclaracao(text),
        numeroRecibo: extrairNumeroRecibo(text),
        autenticacao: extrairAutenticacao(text),
        ...transmissao
    };
}

module.exports = {
    detectarTipoDeclaracao,
    extrairMetadadosDeclaracao,
    extrairNumeroDeclaracao,
    extrairNumeroRecibo,
    extrairTransmissao
};
