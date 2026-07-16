const multer = require('multer');
const { errorResponse } = require('../utils/api.response');

module.exports = function errorMiddleware(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof multer.MulterError) {
        const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        const code = err.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : 'MULTIPART_ERROR';

        return res.status(status).json(
            errorResponse({
                message: 'Não foi possível receber o arquivo.',
                requestId: req.requestId,
                code,
                detail: err.message
            })
        );
    }

    console.error(`[${req.requestId}]`, err);

    return res.status(500).json(
        errorResponse({
            message: 'Erro interno ao processar a requisição.',
            requestId: req.requestId,
            code: 'INTERNAL_ERROR',
            detail: 'O serviço não conseguiu concluir o processamento.'
        })
    );
};
