const crypto = require('crypto');
const config = require('../config/app.config');
const { errorResponse } = require('../utils/api.response');

function safeEquals(left, right) {
    const leftBuffer = Buffer.from(String(left || ''), 'utf8');
    const rightBuffer = Buffer.from(String(right || ''), 'utf8');

    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

module.exports = function apiKeyMiddleware(req, res, next) {
    if (!config.apiKeyRequired) {
        return next();
    }

    const providedKey = String(req.get('X-API-Key') || '').trim();

    if (!providedKey || !safeEquals(providedKey, config.apiKey)) {
        return res.status(401).json(
            errorResponse({
                message: 'Acesso não autorizado.',
                requestId: req.requestId,
                code: 'UNAUTHORIZED',
                detail: 'API Key ausente ou inválida.'
            })
        );
    }

    return next();
};
