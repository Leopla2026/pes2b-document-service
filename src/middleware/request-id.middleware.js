const crypto = require('crypto');

module.exports = function requestIdMiddleware(req, res, next) {
    const incoming = String(req.get('X-Request-Id') || '').trim();
    const requestId = incoming || crypto.randomUUID();

    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    next();
};
