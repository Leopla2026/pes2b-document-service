const detector = require('../detectors/document.detector');
const registry = require('../parsers/registry');
const extractor = require('../extractors/pdf.extractor');
const {
    buildActualContext
} = require('../validators/context.adapter');

const {
    validateExpectedContext
} = require('../validators/context.validator');

const combinadoSplitter = require(
    '../splitters/pgdas.combined.splitter'
);

const decPoaSplitter = require(
    '../splitters/dec-poa.splitter'
);

const { buildResponse } = require('./engine.response');

const ENGINE_VERSION = '1.9.0';

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
    let parserBlocked = false;

    const minimumConfidence =
        parserDefinition?.minimumConfidence ?? 0;

    if (
        parser &&
        detection.confidence >= minimumConfidence
    ) {
        data = parser.parse(extraction.text);

        parserName =
            parserDefinition?.parserName ||
            parser.name ||
            documentType.toLowerCase();
    } else if (parser) {
        parserBlocked = true;
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
        parserDefinition,
        parserBlocked
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
            version: ENGINE_VERSION,
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

async function adicionarPartesDecPoa(
    response,
    buffer,
    data
) {
    const partes = await decPoaSplitter.split(
        buffer,
        {
            razaoSocial:
                data?.company?.razaoSocial,

            cnpj:
                data?.company?.cnpj,

            competence:
                data?.competence
        }
    );

    const documents = partes.map(parte => ({
        role: parte.role,
        suggestedSuffix: parte.suggestedSuffix,
        fileName: parte.fileName,
        pages: parte.pages,

        file: {
            fileName: parte.fileName,
            mimeType: 'application/pdf',
            extension: 'pdf',
            size: parte.buffer.length,
            base64: parte.buffer.toString('base64')
        }
    }));

    return {
        ...response,
        compound: documents.length > 1,
        documents
    };
}

exports.process = async (
    buffer,
    options = {}
) => {
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
    let parserBlocked = false;

    const minimumConfidence =
        parserDefinition?.minimumConfidence ?? 0;

    if (
        parser &&
        detection.confidence >= minimumConfidence
    ) {
        data = parser.parse(extraction.text);

        parserName =
            parserDefinition?.parserName ||
            parser.name ||
            documentType.toLowerCase();
    } else if (parser) {
        parserBlocked = true;
        parserName =
            parserDefinition?.parserName ||
            parser.name ||
            documentType.toLowerCase();
    }

    let response = buildResponse({
    documentType,
    parser: parserName,
    pages: extraction.pages,
    data,
    text: extraction.text,
    detection,
    parserDefinition,
    parserBlocked
});

/*
 * DEC POA:
 * depois do parser conhecer empresa e competência,
 * separamos fisicamente declaração, guia e recibo.
 */
if (
    documentType ===
    'DEC_POA_DECLARACAO_MENSAL'
) {
    response = await adicionarPartesDecPoa(
        response,
        buffer,
        data
    );
}

if (!options.expected) {
    return response;
}

const actualContext = buildActualContext({
    data
});

const validation = validateExpectedContext({
    expected: options.expected,
    actual: actualContext
});

return {
    ...response,
    validation
};
};