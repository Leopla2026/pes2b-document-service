const { errorResponse } = require('../utils/api.response');

module.exports = function notFoundMiddleware(req, res) {
    return res.status(404).json(
        errorResponse({
            message: 'Recurso não encontrado.',
            requestId: req.requestId,
            code: 'RESOURCE_NOT_FOUND',
            detail: `A rota ${req.method} ${req.originalUrl} não existe.`
        })
    );
};
