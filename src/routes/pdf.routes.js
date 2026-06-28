const express = require('express');

const router = express.Router();

router.post('/extract', (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'Endpoint PDF funcionando.'
    });
});

module.exports = router;