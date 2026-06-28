const pdfExtractor = require('../extractors/pdf.extractor');
const documentDetector = require('../detectors/document.detector');
const parserRegistry = require('../parsers/registry');

exports.process = async (buffer) => {

    const extraction = await pdfExtractor.extract(buffer);

    const documentType = documentDetector.detect(extraction.text);

    const parser = parserRegistry[documentType];

    let data = null;

    if (parser) {
        data = parser.parse(extraction.text);
    }

    return {

        success: true,

        documentType,

        pages: extraction.pages,

        data,

        text: extraction.text

    };

};