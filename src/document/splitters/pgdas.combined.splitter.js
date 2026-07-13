const { PDFDocument } = require('pdf-lib');

const extractor = require('../extractors/pdf.extractor');

const MARCADOR_RECIBO =
    'RECIBO DE ENTREGA DA APURAÇÃO NO PGDAS-D';

async function criarPdfComPaginas(pdfOriginal, indices) {
    const novoPdf = await PDFDocument.create();

    const paginas = await novoPdf.copyPages(
        pdfOriginal,
        indices
    );

    for (const pagina of paginas) {
        novoPdf.addPage(pagina);
    }

    const bytes = await novoPdf.save();

    return Buffer.from(bytes);
}

async function extrairTextoPagina(pdfOriginal, indicePagina) {
    const bufferPagina = await criarPdfComPaginas(
        pdfOriginal,
        [indicePagina]
    );

    const resultado = await extractor.extract(bufferPagina);

    return resultado.text || '';
}

exports.split = async function splitPgdasCombinado(buffer) {
    const pdfOriginal = await PDFDocument.load(buffer);

    const totalPaginas = pdfOriginal.getPageCount();

    let indiceInicioRecibo = -1;

    for (let indice = 0; indice < totalPaginas; indice++) {
        const textoPagina = await extrairTextoPagina(
            pdfOriginal,
            indice
        );

        if (
            textoPagina
                .toUpperCase()
                .includes(MARCADOR_RECIBO)
        ) {
            indiceInicioRecibo = indice;
            break;
        }
    }

    if (indiceInicioRecibo <= 0) {
        throw new Error(
            'Não foi possível identificar corretamente a separação entre declaração e recibo.'
        );
    }

    const paginasDeclaracao = Array.from(
        { length: indiceInicioRecibo },
        (_, indice) => indice
    );

    const paginasRecibo = Array.from(
        { length: totalPaginas - indiceInicioRecibo },
        (_, indice) => indiceInicioRecibo + indice
    );

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