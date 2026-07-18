const engine = require('../document/engine/document.engine');
const { errorResponse } = require('../utils/api.response');
const logger = require('../utils/logger');

function buildLogDetails(req, file, result, durationMs) {
    return {
        requestId: req.requestId,
        filename: file?.originalname || null,
        fileSize: file?.size || null,
        documentType: result?.documentType || 'UNKNOWN',
        family: result?.engine?.family || 'UNKNOWN',
        confidence: result?.engine?.confidence ?? 0,
        confidenceLevel: result?.engine?.confidenceLevel || 'LOW',
        parser: result?.engine?.parser || 'none',
        parserExecuted: result?.engine?.parserExecuted ?? false,
        parserBlocked: result?.engine?.parserBlocked ?? false,
        pages: result?.pages ?? null,
        compound: result?.compound ?? false,
        durationMs: Number(durationMs.toFixed(2)),
        warningCount: Array.isArray(result?.warnings) ? result.warnings.length : 0,
        errorCount: Array.isArray(result?.errors) ? result.errors.length : 0
    };
}

exports.extract = async (req, res, next) => {
    try {
        if (!req.file) {
            logger.warn('document_rejected', {
                requestId: req.requestId,
                reason: 'FILE_REQUIRED'
            });

            return res.status(400).json(
                errorResponse({
                    message: 'Nenhum arquivo enviado.',
                    requestId: req.requestId,
                    code: 'FILE_REQUIRED',
                    detail: 'Envie um PDF no campo multipart file.',
                    field: 'file'
                })
            );
        }

        const startedAt = process.hrtime.bigint();
        const result = await engine.process(req.file.buffer);
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;

        logger.info('document_processed', buildLogDetails(
            req,
            req.file,
            result,
            durationMs
        ));

        return res.json({
            ...result,
            requestId: req.requestId
        });
    } catch (err) {
        err.processingContext = {
            requestId: req.requestId,
            filename: req.file?.originalname || null,
            fileSize: req.file?.size || null
        };
        return next(err);
    }
};

exports.extractBatch = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            logger.warn('batch_rejected', {
                requestId: req.requestId,
                reason: 'FILES_REQUIRED'
            });

            return res.status(400).json(
                errorResponse({
                    message: 'Nenhum arquivo enviado.',
                    requestId: req.requestId,
                    code: 'FILES_REQUIRED',
                    detail: 'Envie um ou mais PDFs no campo multipart files.',
                    field: 'files'
                })
            );
        }

        const batchStartedAt = process.hrtime.bigint();
        const documents = [];

        for (const file of req.files) {
            const startedAt = process.hrtime.bigint();

            try {
                const result = await engine.process(file.buffer);
                const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;

                logger.info('batch_document_processed', buildLogDetails(
                    req,
                    file,
                    result,
                    durationMs
                ));

                documents.push({
                    filename: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    ...result
                });
            } catch (err) {
                const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;

                logger.error('batch_document_failed', {
                    requestId: req.requestId,
                    filename: file.originalname,
                    fileSize: file.size,
                    durationMs: Number(durationMs.toFixed(2)),
                    error: logger.normalizeError(err)
                });

                documents.push({
                    filename: file.originalname,
                    success: false,
                    message: err.message
                });
            }
        }

        const batchDurationMs = Number(process.hrtime.bigint() - batchStartedAt) / 1e6;
        const failedFiles = documents.filter((document) => document.success === false).length;

        logger.info('batch_completed', {
            requestId: req.requestId,
            totalFiles: req.files.length,
            successfulFiles: req.files.length - failedFiles,
            failedFiles,
            durationMs: Number(batchDurationMs.toFixed(2))
        });

        return res.json({
            success: true,
            requestId: req.requestId,
            totalFiles: req.files.length,
            documents,
            errors: [],
            warnings: []
        });
    } catch (err) {
        return next(err);
    }
};
