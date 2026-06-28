const pdfExtractor = require('../document/extractors/pdf.extractor');

exports.extract = async (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Nenhum arquivo enviado.'
        });
    }

    return res.json({
        success: true,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
    });

};