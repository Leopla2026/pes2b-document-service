const pdf = require('pdf-parse');

exports.extract = async (buffer) => {

    const data = await pdf(buffer);

    return {
        success: true,
        pages: data.numpages,
        info: data.info,
        metadata: data.metadata,
        text: data.text
    };

};