const pdfExtractor = require('../document/extractors/pdf.extractor');

exports.extract = async (req, res) => {

    return res.status(200).json({
        success: true,
        message: 'Extractor carregado.'
    });

};