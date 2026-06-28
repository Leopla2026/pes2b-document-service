const express = require('express');

const router = express.Router();

const upload = require('../config/multer');
const pdfController = require('../controllers/pdf.controller');

router.post(
    '/extract',
    upload.single('file'),
    pdfController.extract
);

module.exports = router;