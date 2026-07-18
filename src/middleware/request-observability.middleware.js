const logger = require('../utils/logger');

module.exports = function requestObservabilityMiddleware(req, res, next) {
    const startedAt = process.hrtime.bigint();

    logger.info('request_started', {
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl
    });

    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;

        logger.info('request_completed', {
            requestId: req.requestId,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: Number(durationMs.toFixed(2))
        });
    });

    next();
};
