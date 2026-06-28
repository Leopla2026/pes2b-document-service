const pdfExtractor = require('../document/extractors/pdf.extractor');

exports.extract = async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum arquivo enviado.'
            });
        }

        const result = await pdfExtractor.extract(req.file.buffer);

        return res.json(result);

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};