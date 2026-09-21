const pdf = require('pdf-parse');

async function main(message) {
    const buffer = Buffer.from(message.base64, 'base64');

    if (message.mode === 'pages') {
        const pageTexts = [];
        const data = await pdf(buffer, {
            pagerender: async pageData => {
                const textContent =
                    await pageData.getTextContent();

                const text = textContent.items
                    .map(item => item.str)
                    .join(' ');

                pageTexts.push(text);
                return text;
            }
        });

        process.send({
            pages: data.numpages,
            pageTexts
        });
        return;
    }

    const data = await pdf(buffer);

    process.send({
        pages: data.numpages,
        info: data.info || null,
        metadata: data.metadata || null,
        text: data.text || ''
    });
}

process.once('message', message => {
    main(message)
        .catch(error => {
            process.send({
                error: {
                    name: error.name,
                    message: error.message,
                    details: error.details || null
                }
            });
        })
        .finally(() => {
            process.disconnect();
        });
});
