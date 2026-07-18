const detector = require('../detectors/document.detector');
const registry = require('../parsers/registry');
const extractor = require('../extractors/pdf.extractor');

const combinadoSplitter = require(
    '../splitters/pgdas.combined.splitter'
);

const { buildResponse } = require('./engine.response');

async function processarDocumentoSimples(buffer) {
    const extraction = await extractor.extract(buffer);

    const detection = detector.detectDetailed(extraction.text);
    const documentType = detection.documentType;

    const parserDefinition =
        registry.getDefinition(documentType);

    const parser =
        registry.getParser(documentType);

    let data = {};
    let parserName = 'none';

    if (parser) {
        data = parser.parse(extraction.text);

        parserName =
            parserDefinition?.parserName ||
            parser.name ||
            documentType.toLowerCase();
    }

    return buildResponse({
        documentType,
        parser: parserName,
        pages: extraction.pages,
        data,
        text: extraction.text,
        detection,
        parserDefinition
    });
}

async function processarDocumentoCombinado(
    buffer,
    extractionOriginal
) {
    const partes = await combinadoSplitter.split(buffer);

    const documents = [];

    for (const parte of partes) {
        const resultado = await processarDocumentoSimples(
            parte.buffer
        );

        if (
            resultado.documentType !==
            parte.expectedDocumentType
        ) {
            throw new Error(
                `A parte ${parte.role} foi separada, mas identificada como ` +
                `${resultado.documentType}. Era esperado ${parte.expectedDocumentType}.`
            );
        }

        documents.push({
            role: parte.role,
            suggestedSuffix: parte.suggestedSuffix,

            documentType: resultado.documentType,
            pages: resultado.pages,

            engine: resultado.engine,
            data: resultado.data,
            warnings: resultado.warnings,
            errors: resultado.errors,
            text: resultado.text,

            file: {
                mimeType: 'application/pdf',
                extension: 'pdf',
                size: parte.buffer.length,
                base64: parte.buffer.toString('base64')
            }
        });
    }

    return {
        success: true,

        engine: {
            version: '1.6.0',
            parser: 'pgdas-combined-splitter',
            confidence: 1
        },

        documentType:
            'COMBINADO_DECLARACAO_RECIBO_PGDAS',

        pages: extractionOriginal.pages,

        compound: true,

        documents,

        warnings: [],
        errors: [],

        text: extractionOriginal.text
    };
}

exports.process = async (buffer) => {
    const extraction = await extractor.extract(buffer);

    const detection = detector.detectDetailed(extraction.text);
    const documentType = detection.documentType;

    if (
        documentType ===
        'COMBINADO_DECLARACAO_RECIBO_PGDAS'
    ) {
        return processarDocumentoCombinado(
            buffer,
            extraction
        );
    }

    const parserDefinition =
        registry.getDefinition(documentType);

    const parser =
        registry.getParser(documentType);

    let data = {};
    let parserName = 'none';

    if (parser) {
        data = parser.parse(extraction.text);

        parserName =
            parserDefinition?.parserName ||
            parser.name ||
            documentType.toLowerCase();
    }

    return buildResponse({
        documentType,
        parser: parserName,
        pages: extraction.pages,
        data,
        text: extraction.text,
        detection,
        parserDefinition
    });
};