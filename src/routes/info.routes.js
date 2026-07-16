const express = require('express');
const config = require('../config/app.config');

const router = express.Router();

router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Informações do serviço.',
        requestId: req.requestId,
        data: {
            service: config.serviceName,
            version: config.version,
            environment: config.environment,
            authentication: {
                type: 'apiKey',
                header: 'X-API-Key'
            }
        },
        errors: [],
        warnings: []
    });
});

module.exports = router;
