const pdf = require('pdf-parse');
const textNormalizer = require('../utils/text.normalizer');

exports.extract = async (buffer) => {

    const data = await pdf(buffer);

    return {

        success: true,

        pages: data.numpages,

        info: data.info,

        metadata: data.metadata,

        text: textNormalizer.normalize(data.text)

    };

};