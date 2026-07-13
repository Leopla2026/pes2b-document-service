const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'pes2b-document-service',
        version: '1.3.0',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;