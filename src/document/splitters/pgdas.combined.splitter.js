const { PDFDocument } = require('pdf-lib');

async function carregarPdf(buffer) {
    if (!Buffer.isBuffer(buffer)) {
        throw new Error(
            'O conteúdo recebido pelo divisor não é um Buffer válido.'
        );
    }

    if (buffer.length < 5) {
        throw new Error(
            'O PDF recebido está vazio ou incompleto.'
        );
    }

    const assinatura = buffer
        .subarray(0, 5)
        .toString('ascii');

    if (assinatura !== '%PDF-') {
        throw new Error(
            `Arquivo sem assinatura PDF válida. Início encontrado: ${assinatura}`
        );
    }

    return PDFDocument.load(
        new Uint8Array(buffer),
        {
            ignoreEncryption: true,
            throwOnInvalidObject: false,
            updateMetadata: false
        }
    );
}

async function criarPdfComPaginas(pdfOriginal, indices) {
    if (!Array.isArray(indices) || indices.length === 0) {
        throw new Error(
            'Nenhuma página foi informada para criação do PDF.'
        );
    }

    const novoPdf = await PDFDocument.create();

    const paginasCopiadas = await novoPdf.copyPages(
        pdfOriginal,
        indices
    );

    for (const pagina of paginasCopiadas) {
        novoPdf.addPage(pagina);
    }

    const bytes = await novoPdf.save({
        useObjectStreams: false,
        addDefaultPage: false
    });

    return Buffer.from(bytes);
}

exports.split = async function splitPgdasCombinado(buffer) {
    const pdfOriginal = await carregarPdf(buffer);

    const totalPaginas = pdfOriginal.getPageCount();

    if (totalPaginas < 2) {
        throw new Error(
            `Documento combinado possui apenas ${totalPaginas} página(s).`
        );
    }

    /*
     * Padrão do Integra Contador:
     *
     * - Todas as páginas anteriores formam a declaração;
     * - A última página contém o recibo de entrega.
     *
     * Exemplo:
     * páginas 1, 2 e 3 = declaração
     * página 4 = recibo
     */

    const indiceUltimaPagina = totalPaginas - 1;

    const paginasDeclaracao = Array.from(
        { length: indiceUltimaPagina },
        (_, indice) => indice
    );

    const paginasRecibo = [
        indiceUltimaPagina
    ];

    const declaracaoBuffer = await criarPdfComPaginas(
        pdfOriginal,
        paginasDeclaracao
    );

    const reciboBuffer = await criarPdfComPaginas(
        pdfOriginal,
        paginasRecibo
    );

    return [
        {
            role: 'DECLARACAO',
            expectedDocumentType: 'DECLARACAO_PGDAS',
            suggestedSuffix: 'DECLARACAO',
            pages: paginasDeclaracao.length,
            buffer: declaracaoBuffer
        },
        {
            role: 'RECIBO',
            expectedDocumentType: 'RECIBO_PGDAS',
            suggestedSuffix: 'RECIBO',
            pages: paginasRecibo.length,
            buffer: reciboBuffer
        }
    ];
};