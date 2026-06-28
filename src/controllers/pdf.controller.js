const parserRegistry = require('../document/parsers/registry');
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

        const parser = parserRegistry[documentType];

        let parsedData = null;

        if (parser) {
            parsedData = parser.parse(result.text);
        }

        return res.json({
            success: true,
            documentType,
            pages: result.pages,
            data: parsedData,
            text: result.text
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};