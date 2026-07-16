const engine = require('../document/engine/document.engine');
const { errorResponse } = require('../utils/api.response');

exports.extract = async (req, res, next) => {
    try {
        if (!req.file) {
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

        const result = await engine.process(req.file.buffer);
        return res.json({
            ...result,
            requestId: req.requestId
        });
    } catch (err) {
        return next(err);
    }
};

exports.extractBatch = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
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

        const documents = [];

        for (const file of req.files) {
            try {
                const result = await engine.process(file.buffer);
                documents.push({
                    filename: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    ...result
                });
            } catch (err) {
                documents.push({
                    filename: file.originalname,
                    success: false,
                    message: err.message
                });
            }
        }

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
