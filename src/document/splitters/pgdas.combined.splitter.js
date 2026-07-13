const { PDFDocument } = require('pdf-lib');

const extractor = require('../extractors/pdf.extractor');

const MARCADOR_RECIBO =
    'RECIBO DE ENTREGA DA APURAÇÃO NO PGDAS-D';

async function carregarPdf(buffer) {
    if (!Buffer.isBuffer(buffer)) {
        throw new Error(
            'O conteúdo recebido pelo divisor não é um Buffer válido.'
        );
    }

    if (buffer.length < 5) {
        throw new Error(
            'O PDF recebido pelo divisor está vazio ou incompleto.'
        );
    }

    const assinatura = buffer
        .subarray(0, 5)
        .toString('ascii');

    if (assinatura !== '%PDF-') {
        throw new Error(
            `O arquivo recebido não possui assinatura PDF válida. Início encontrado: ${assinatura}`
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

async function criarPdfComPaginas(
    pdfOriginal,
    indices
) {
    if (!Array.isArray(indices) || indices.length === 0) {
        throw new Error(
            'Nenhuma página foi informada para criação do PDF.'
        );
    }

    const novoPdf = await PDFDocument.create();

    const paginas = await novoPdf.copyPages(
        pdfOriginal,
        indices
    );

    for (const pagina of paginas) {
        novoPdf.addPage(pagina);
    }

    const bytes = await novoPdf.save({
        useObjectStreams: false,
        addDefaultPage: false,
        updateFieldAppearances: false
    });

    return Buffer.from(bytes);
}

async function extrairTextoPagina(
    pdfOriginal,
    indicePagina
) {
    const bufferPagina =
        await criarPdfComPaginas(
            pdfOriginal,
            [indicePagina]
        );

    const resultado =
        await extractor.extract(bufferPagina);

    return resultado.text || '';
}

exports.split = async function splitPgdasCombinado(
    buffer
) {
    const pdfOriginal =
        await carregarPdf(buffer);

    const totalPaginas =
        pdfOriginal.getPageCount();

    if (totalPaginas < 2) {
        throw new Error(
            `Documento combinado possui apenas ${totalPaginas} página(s).`
        );
    }

    let indiceInicioRecibo = -1;

    for (
        let indice = 0;
        indice < totalPaginas;
        indice++
    ) {
        const textoPagina =
            await extrairTextoPagina(
                pdfOriginal,
                indice
            );

        const textoNormalizado =
            String(textoPagina)
                .toUpperCase()
                .replace(/\s+/g, ' ')
                .trim();

        if (
            textoNormalizado.includes(
                MARCADOR_RECIBO
            )
        ) {
            indiceInicioRecibo = indice;
            break;
        }
    }

    if (indiceInicioRecibo < 1) {
        throw new Error(
            'Não foi possível localizar uma página de recibo posterior às páginas da declaração.'
        );
    }

    const paginasDeclaracao =
        Array.from(
            {
                length: indiceInicioRecibo
            },
            (_, indice) => indice
        );

    const paginasRecibo =
        Array.from(
            {
                length:
                    totalPaginas -
                    indiceInicioRecibo
            },
            (_, indice) =>
                indiceInicioRecibo + indice
        );

    const declaracaoBuffer =
        await criarPdfComPaginas(
            pdfOriginal,
            paginasDeclaracao
        );

    const reciboBuffer =
        await criarPdfComPaginas(
            pdfOriginal,
            paginasRecibo
        );

    return [
        {
            role: 'DECLARACAO',
            expectedDocumentType:
                'DECLARACAO_PGDAS',
            suggestedSuffix:
                'DECLARACAO',
            pages:
                paginasDeclaracao.length,
            buffer:
                declaracaoBuffer
        },
        {
            role: 'RECIBO',
            expectedDocumentType:
                'RECIBO_PGDAS',
            suggestedSuffix:
                'RECIBO',
            pages:
                paginasRecibo.length,
            buffer:
                reciboBuffer
        }
    ];
};