const pgdasParser = require('../document/parsers/pgdas.parser');
const pdfExtractor = require('../document/extractors/pdf.extractor');
const documentDetector = require('../document/detectors/document.detector');

exports.extract = async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum arquivo enviado.'
            });
        }

const result = await pdfExtractor.extract(req.file.buffer);

const documentType = documentDetector.detect(result.text);

let data = null;

if (documentType === 'PGDAS') {
    data = pgdasParser.parse(result.text);
}

return res.json({

    success: true,

    documentType,

    pages: result.pages,

    data,

    text: result.text

});

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};