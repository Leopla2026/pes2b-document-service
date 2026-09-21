const detector = require('../detectors/document.detector');
const registry = require('../parsers/registry');
const extractor = require('../extractors/pdf.extractor');
const {
    buildDecPoaConfidence
} = require('../metadata/dec-poa.confidence');

const {
    buildActualContext
} = require('../validators/context.adapter');

const {
    validateExpectedContext
} = require('../validators/context.validator');

const {
    createParseId,
    buildContractMetadata,
    buildDocumentMetadata,
    buildProcessingMetadata,
    resolveIsExpectedDocument
} = require('../metadata/document.metadata');

const combinadoSplitter = require(
    '../splitters/pgdas.combined.splitter'
);

const decPoaSplitter = require(
    '../splitters/dec-poa.splitter'
);

const { buildResponse } = require('./engine.response');

const ENGINE_VERSION = '1.11.0';

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

function adicionarMetadadosDecPoa({
    response,
    buffer,
    pages,
    parserName,
    expected,
    validation,
    startedAt,
    startedAtMs
}) {
    const finishedAtMs = Date.now();
    const finishedAt =
        new Date(finishedAtMs).toISOString();

    return {
        ...response,

classification:
    'DECLARACAO_MENSAL',

confidence:
    buildDecPoaConfidence(
        response.data || {}
    ),

        parseId:
            createParseId(),

        contract:
            buildContractMetadata({
                adapter: parserName,
                layoutVersion: '2026.1'
            }),

        document:
            buildDocumentMetadata({
                buffer,
                pages
            }),

        processing:
            buildProcessingMetadata({
                startedAt,
                finishedAt,
                durationMs:
                    finishedAtMs - startedAtMs,
                engineVersion:
                    ENGINE_VERSION
            }),

        isExpectedDocument:
            resolveIsExpectedDocument({
                expected,
                validation
            })
    };
}

exports.process = async (
    buffer,
    options = {}
) => {
    const startedAtMs = Date.now();
    const startedAt =
        new Date(startedAtMs).toISOString();

    const extraction = await extractor.extract(buffer);

    const detection = detector.detectDetailed(
        extraction.text
    );

    const documentType = detection.documentType;

    /*
     * Fluxo combinado PGDAS permanece exatamente
     * no caminho legado, sem novos metadados.
     */
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
     * A partir daqui, somente DEC POA recebe
     * as extensões do novo contrato.
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

    let validation = null;

    if (options.expected) {
        const actualContext =
            buildActualContext({
                data
            });

        validation =
            validateExpectedContext({
                expected: options.expected,
                actual: actualContext
            });

        response = {
            ...response,
            validation
        };
    }

    /*
     * Metadados novos são adicionados exclusivamente
     * ao DEC POA.
     *
     * Simples Nacional e demais documentos mantêm
     * o contrato anterior.
     */
    if (
        documentType ===
        'DEC_POA_DECLARACAO_MENSAL'
    ) {
        response = adicionarMetadadosDecPoa({
            response,
            buffer,
            pages: extraction.pages,
            parserName,
            expected: options.expected || null,
            validation,
            startedAt,
            startedAtMs
        });
    }

    return response;
};
