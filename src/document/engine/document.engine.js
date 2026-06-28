const detector = require('../detectors/document.detector');
const registry = require('../parsers/registry');
const extractor = require('../extractors/pdf.extractor');

const { buildResponse } = require('./engine.response');

exports.process = async (buffer) => {

    const extraction = await extractor.extract(buffer);

    const documentType = detector.detect(extraction.text);

    const parser = registry[documentType];

    let data = {};

    let parserName = "none";

    if (parser) {

        data = parser.parse(extraction.text);

        parserName = parser.name || documentType.toLowerCase();

    }

    return buildResponse({

        documentType,

        parser: parserName,

        pages: extraction.pages,

        data,

        text: extraction.text

    });

};